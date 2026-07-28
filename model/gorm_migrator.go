package model

import (
	"fmt"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
	"gorm.io/gorm/migrator"
	"gorm.io/gorm/schema"
)

// uniqueIndexSafeDialector 阻止 AutoMigrate 删除由 `uniqueIndex` 标签维护的唯一索引。
// GORM 只能从列元数据判断“列级唯一”,而 MySQL 把唯一索引同样报告为 column_key=UNI,
// 于是 MigrateColumnUnique 误判模型已不需要唯一约束并发出
// `ALTER TABLE x DROP FOREIGN KEY uni_x_y`,MySQL 以 Error 1091 拒绝,导致启动失败。
type uniqueIndexSafeDialector struct {
	gorm.Dialector
}

func newUniqueIndexSafeDialector(dialector gorm.Dialector) gorm.Dialector {
	return uniqueIndexSafeDialector{Dialector: dialector}
}

func (d uniqueIndexSafeDialector) Migrator(db *gorm.DB) gorm.Migrator {
	return uniqueIndexSafeMigrator{Migrator: d.Dialector.Migrator(db)}
}

func (d uniqueIndexSafeDialector) Apply(config *gorm.Config) error {
	applier, ok := d.Dialector.(interface {
		Apply(*gorm.Config) error
	})
	if !ok {
		return nil
	}
	return applier.Apply(config)
}

func (d uniqueIndexSafeDialector) SavePoint(tx *gorm.DB, name string) error {
	savePointer, ok := d.Dialector.(gorm.SavePointerDialectorInterface)
	if !ok {
		return gorm.ErrUnsupportedDriver
	}
	return savePointer.SavePoint(tx, name)
}

func (d uniqueIndexSafeDialector) RollbackTo(tx *gorm.DB, name string) error {
	savePointer, ok := d.Dialector.(gorm.SavePointerDialectorInterface)
	if !ok {
		return gorm.ErrUnsupportedDriver
	}
	return savePointer.RollbackTo(tx, name)
}

func (d uniqueIndexSafeDialector) Translate(err error) error {
	translator, ok := d.Dialector.(gorm.ErrorTranslator)
	if !ok {
		return err
	}
	return translator.Translate(err)
}

type uniqueIndexSafeMigrator struct {
	gorm.Migrator
}

func (m uniqueIndexSafeMigrator) MigrateColumnUnique(dst interface{}, field *schema.Field, columnType gorm.ColumnType) error {
	if unique, ok := columnType.Unique(); ok && unique && !field.Unique && !field.PrimaryKey {
		table := ""
		if field.Schema != nil {
			table = field.Schema.Table
		}
		common.SysLog(fmt.Sprintf("keeping existing unique index on %s.%s: the model declares uniqueIndex, not a column-level unique constraint", table, field.DBName))
		return nil
	}
	return m.Migrator.MigrateColumnUnique(dst, field, columnType)
}

// BuildIndexOptions 必须转发:GORM 建索引时会把 db.Migrator() 断言成该接口。
func (m uniqueIndexSafeMigrator) BuildIndexOptions(opts []schema.IndexOption, stmt *gorm.Statement) []interface{} {
	builder, ok := m.Migrator.(migrator.BuildIndexOptionsInterface)
	if !ok {
		return nil
	}
	return builder.BuildIndexOptions(opts, stmt)
}
