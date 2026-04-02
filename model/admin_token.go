package model

import (
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/bytedance/gopkg/util/gopool"
	"gorm.io/gorm"
)

// AdminToken 为管理员令牌列表/详情补充归属用户名，避免复用仅面向当前用户的自助查询结构。
type AdminToken struct {
	Token
	UserName string `json:"user_name" gorm:"column:user_name"`
}

func adminTokenQuery(tx *gorm.DB) *gorm.DB {
	return tx.Model(&Token{}).Joins("LEFT JOIN users ON users.id = tokens.user_id")
}

func adminTokenSelect(tx *gorm.DB) *gorm.DB {
	return adminTokenQuery(tx).Select("tokens.*, users.username AS user_name")
}

func applyAdminTokenFilters(tx *gorm.DB, keyword string, token string) (*gorm.DB, error) {
	query := adminTokenQuery(tx)

	if keyword != "" {
		keywordPattern, err := sanitizeLikePattern(keyword)
		if err != nil {
			return nil, err
		}
		query = query.Where("(tokens.name LIKE ? ESCAPE '!' OR users.username LIKE ? ESCAPE '!')", keywordPattern, keywordPattern)
	}

	if token != "" {
		token = strings.TrimPrefix(token, "sk-")
		tokenPattern, err := sanitizeLikePattern(token)
		if err != nil {
			return nil, err
		}
		query = query.Where("tokens."+commonKeyCol+" LIKE ? ESCAPE '!'", tokenPattern)
	}

	return query, nil
}

func GetAllAdminTokens(startIdx int, num int) (tokens []*AdminToken, total int64, err error) {
	err = DB.Model(&Token{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = adminTokenSelect(DB).Order("tokens.id desc").Limit(num).Offset(startIdx).Find(&tokens).Error
	if err != nil {
		return nil, 0, err
	}

	return tokens, total, nil
}

func SearchAdminTokens(keyword string, token string, offset int, limit int) (tokens []*AdminToken, total int64, err error) {
	if limit <= 0 || limit > searchHardLimit {
		limit = searchHardLimit
	}
	if offset < 0 {
		offset = 0
	}

	query, err := applyAdminTokenFilters(DB, keyword, token)
	if err != nil {
		return nil, 0, err
	}

	err = query.Session(&gorm.Session{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Session(&gorm.Session{}).Select("tokens.*, users.username AS user_name").Order("tokens.id desc").Offset(offset).Limit(limit).Find(&tokens).Error
	if err != nil {
		return nil, 0, err
	}

	return tokens, total, nil
}

func GetAdminTokenById(id int) (*AdminToken, error) {
	if id == 0 {
		return nil, errors.New("id 为空！")
	}

	token := AdminToken{}
	err := adminTokenSelect(DB).Where("tokens.id = ?", id).First(&token).Error
	return &token, err
}

func DeleteAdminTokenById(id int) error {
	if id == 0 {
		return errors.New("id 为空！")
	}

	token := Token{Id: id}
	err := DB.Where("id = ?", id).First(&token).Error
	if err != nil {
		return err
	}
	return token.Delete()
}

func BatchDeleteAdminTokens(ids []int) (int, error) {
	if len(ids) == 0 {
		return 0, errors.New("ids 不能为空！")
	}

	tx := DB.Begin()
	if tx.Error != nil {
		return 0, tx.Error
	}

	var tokens []Token
	if err := tx.Where("id IN (?)", ids).Find(&tokens).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := tx.Where("id IN (?)", ids).Delete(&Token{}).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := tx.Commit().Error; err != nil {
		return 0, err
	}

	if common.RedisEnabled {
		gopool.Go(func() {
			for _, token := range tokens {
				_ = cacheDeleteToken(token.Key)
			}
		})
	}

	return len(tokens), nil
}
