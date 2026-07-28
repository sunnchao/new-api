package model

import (
	"database/sql"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/migrator"
	"gorm.io/gorm/schema"
	"gorm.io/gorm/utils/tests"
)

type recordingUniqueMigrator struct {
	gorm.Migrator
	delegated bool
}

func (m *recordingUniqueMigrator) MigrateColumnUnique(interface{}, *schema.Field, gorm.ColumnType) error {
	m.delegated = true
	return nil
}

func TestUniqueIndexSafeMigratorMigrateColumnUnique(t *testing.T) {
	cases := []struct {
		name          string
		columnUnique  sql.NullBool
		fieldUnique   bool
		fieldPK       bool
		wantDelegated bool
	}{
		{
			name:          "unique index column is not dropped",
			columnUnique:  sql.NullBool{Bool: true, Valid: true},
			fieldUnique:   false,
			wantDelegated: false,
		},
		{
			name:          "column level unique tag still migrates",
			columnUnique:  sql.NullBool{Bool: true, Valid: true},
			fieldUnique:   true,
			wantDelegated: true,
		},
		{
			name:          "missing unique constraint still migrates",
			columnUnique:  sql.NullBool{Bool: false, Valid: true},
			fieldUnique:   true,
			wantDelegated: true,
		},
		{
			name:          "driver without unique metadata still migrates",
			columnUnique:  sql.NullBool{},
			fieldUnique:   false,
			wantDelegated: true,
		},
		{
			name:          "primary key still migrates",
			columnUnique:  sql.NullBool{Bool: true, Valid: true},
			fieldPK:       true,
			wantDelegated: true,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			delegate := &recordingUniqueMigrator{}
			field := &schema.Field{
				DBName:     "key",
				Unique:     tc.fieldUnique,
				PrimaryKey: tc.fieldPK,
				Schema:     &schema.Schema{Table: "tokens"},
			}

			err := uniqueIndexSafeMigrator{Migrator: delegate}.MigrateColumnUnique(
				&Token{}, field, migrator.ColumnType{UniqueValue: tc.columnUnique},
			)

			require.NoError(t, err)
			assert.Equal(t, tc.wantDelegated, delegate.delegated)
		})
	}
}

func TestUniqueIndexSafeDialectorCreatesUniqueIndex(t *testing.T) {
	db, err := gorm.Open(newUniqueIndexSafeDialector(sqlite.Open(":memory:")), &gorm.Config{})
	require.NoError(t, err)

	require.NoError(t, db.AutoMigrate(&Token{}))
	assert.True(t, db.Migrator().HasIndex(&Token{}, "idx_tokens_key"))
}

type savePointRecordingDialector struct {
	tests.DummyDialector
	savePoint  string
	rollbackTo string
}

func (d *savePointRecordingDialector) SavePoint(_ *gorm.DB, name string) error {
	d.savePoint = name
	return nil
}

func (d *savePointRecordingDialector) RollbackTo(_ *gorm.DB, name string) error {
	d.rollbackTo = name
	return nil
}

func TestUniqueIndexSafeDialectorForwardsSavePoints(t *testing.T) {
	inner := &savePointRecordingDialector{}

	savePointer, ok := newUniqueIndexSafeDialector(inner).(gorm.SavePointerDialectorInterface)
	require.True(t, ok)

	require.NoError(t, savePointer.SavePoint(nil, "sp1"))
	require.NoError(t, savePointer.RollbackTo(nil, "sp1"))

	assert.Equal(t, "sp1", inner.savePoint)
	assert.Equal(t, "sp1", inner.rollbackTo)
}
