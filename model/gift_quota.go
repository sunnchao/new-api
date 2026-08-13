package model

import (
	"errors"
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"gorm.io/gorm"
)

const (
	GiftQuotaSourceCheckin    = "checkin"
	GiftQuotaSourceTopupBonus = "topup_bonus"
)

var ErrInsufficientUserQuota = errors.New("user quota is not enough")

// UserGiftQuota records one auditable gift quota grant and its remaining balance.
type UserGiftQuota struct {
	Id             int64  `json:"id" gorm:"primaryKey"`
	UserId         int    `json:"user_id" gorm:"not null;index:idx_user_gift_quota_active,priority:1;uniqueIndex:idx_user_gift_quota_source,priority:1"`
	Source         string `json:"source" gorm:"type:varchar(32);not null;index;uniqueIndex:idx_user_gift_quota_source,priority:2"`
	SourceId       int64  `json:"source_id" gorm:"not null;index;uniqueIndex:idx_user_gift_quota_source,priority:3"`
	Quota          int    `json:"quota" gorm:"type:int;not null"`
	RemainingQuota int    `json:"remaining_quota" gorm:"type:int;not null"`
	CreatedAt      int64  `json:"created_at" gorm:"type:bigint;not null"`
	ExpiresAt      int64  `json:"expires_at" gorm:"type:bigint;not null;default:0;index:idx_user_gift_quota_active,priority:2"`
}

func (UserGiftQuota) TableName() string {
	return "user_gift_quotas"
}

// UserQuotaBalance separates persistent regular quota from active gift quota.
type UserQuotaBalance struct {
	Regular int `json:"regular_quota"`
	Gift    int `json:"gift_quota"`
	Total   int `json:"total_quota"`
}

// UserGiftQuotaHistoryItem is the public projection of one gift quota grant.
type UserGiftQuotaHistoryItem struct {
	Id        int64  `json:"id"`
	Source    string `json:"source"`
	Quota     int    `json:"quota"`
	CreatedAt int64  `json:"created_at"`
	ExpiresAt int64  `json:"expires_at"`
}

// GrantGiftQuota creates a gift quota batch while holding the owning user row lock.
func GrantGiftQuota(tx *gorm.DB, userId int, source string, sourceId int64, quota int, grantedAt time.Time, expiresAt int64) (*UserGiftQuota, error) {
	if tx == nil {
		return nil, errors.New("database handle is required")
	}
	if userId <= 0 || sourceId <= 0 || quota <= 0 {
		return nil, errors.New("gift quota user, source id, and amount must be positive")
	}
	if source != GiftQuotaSourceCheckin && source != GiftQuotaSourceTopupBonus {
		return nil, errors.New("unsupported gift quota source")
	}
	if expiresAt > 0 && expiresAt <= grantedAt.Unix() {
		return nil, errors.New("gift quota expiration must be after grant time")
	}

	var user User
	if err := lockForUpdate(tx).Select("id", "quota").Where("id = ?", userId).First(&user).Error; err != nil {
		return nil, err
	}
	var giftQuota int64
	if err := tx.Model(&UserGiftQuota{}).
		Where("user_id = ? AND remaining_quota > 0 AND (expires_at = 0 OR expires_at > ?)", userId, grantedAt.Unix()).
		Select("COALESCE(SUM(remaining_quota), 0)").Scan(&giftQuota).Error; err != nil {
		return nil, err
	}
	if giftQuota+int64(quota) > int64(common.MaxQuota) {
		return nil, errors.New("gift quota would exceed the maximum gift balance")
	}

	gift := &UserGiftQuota{
		UserId:         userId,
		Source:         source,
		SourceId:       sourceId,
		Quota:          quota,
		RemainingQuota: quota,
		CreatedAt:      grantedAt.Unix(),
		ExpiresAt:      expiresAt,
	}
	if err := tx.Create(gift).Error; err != nil {
		return nil, err
	}
	return gift, nil
}

// GetUserQuotaBalance returns regular, currently active gift, and total quota.
func GetUserQuotaBalance(userId int, now int64) (UserQuotaBalance, error) {
	var balance UserQuotaBalance
	if err := DB.Model(&User{}).Where("id = ?", userId).Select("quota").Scan(&balance.Regular).Error; err != nil {
		return balance, err
	}
	var gift int64
	if err := DB.Model(&UserGiftQuota{}).
		Where("user_id = ? AND remaining_quota > 0 AND (expires_at = 0 OR expires_at > ?)", userId, now).
		Select("COALESCE(SUM(remaining_quota), 0)").Scan(&gift).Error; err != nil {
		return balance, err
	}
	total := int64(balance.Regular) + gift
	maxInt := int64(^uint(0) >> 1)
	minInt := -maxInt - 1
	if gift < 0 || gift > maxInt || total > maxInt || total < minInt {
		return balance, errors.New("user quota balance is outside the supported range")
	}
	balance.Gift = int(gift)
	balance.Total = int(total)
	return balance, nil
}

// GetUserGiftQuotaHistory returns all grants for one user, including consumed and expired grants.
func GetUserGiftQuotaHistory(userId int, startIdx int, num int) (items []UserGiftQuotaHistoryItem, total int64, err error) {
	query := DB.Model(&UserGiftQuota{}).Where("user_id = ?", userId)
	if err = query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err = query.
		Select("id", "source", "quota", "created_at", "expires_at").
		Order("created_at DESC, id DESC").
		Limit(num).
		Offset(startIdx).
		Find(&items).Error
	return items, total, err
}

// GetNextGiftQuotaExpiration returns the nearest active finite expiration time.
func GetNextGiftQuotaExpiration(userId int, now int64) (int64, error) {
	var expiresAt int64
	err := DB.Model(&UserGiftQuota{}).
		Where("user_id = ? AND remaining_quota > 0 AND expires_at > ?", userId, now).
		Select("COALESCE(MIN(expires_at), 0)").Scan(&expiresAt).Error
	return expiresAt, err
}

func userCacheTTLWithGiftExpiration(userId int, ttl int) int {
	now := time.Now().Unix()
	expiresAt, err := GetNextGiftQuotaExpiration(userId, now)
	if err != nil || expiresAt <= 0 {
		return ttl
	}
	secondsUntilExpiry := int(expiresAt - now)
	if secondsUntilExpiry < 1 {
		secondsUntilExpiry = 1
	}
	if secondsUntilExpiry < ttl {
		return secondsUntilExpiry
	}
	return ttl
}

// ConsumeWalletQuota consumes finite gifts, permanent gifts, then regular quota.
func ConsumeWalletQuota(userId int, quota int) (relaycommon.WalletQuotaAllocation, error) {
	allocation := relaycommon.WalletQuotaAllocation{}
	if quota < 0 {
		return allocation, errors.New("quota cannot be negative")
	}
	if quota == 0 {
		return allocation, nil
	}

	err := DB.Transaction(func(tx *gorm.DB) error {
		var user User
		if err := lockForUpdate(tx).Select("id", "quota").Where("id = ?", userId).First(&user).Error; err != nil {
			return err
		}

		now := time.Now().Unix()
		var gifts []UserGiftQuota
		if err := lockForUpdate(tx).
			Where("user_id = ? AND remaining_quota > 0 AND (expires_at = 0 OR expires_at > ?)", userId, now).
			Order("CASE WHEN expires_at = 0 THEN 1 ELSE 0 END, expires_at ASC, id ASC").
			Find(&gifts).Error; err != nil {
			return err
		}

		available := int64(user.Quota)
		for _, gift := range gifts {
			available += int64(gift.RemainingQuota)
		}
		if available < int64(quota) {
			return fmt.Errorf("%w: remain=%d, need=%d", ErrInsufficientUserQuota, available, quota)
		}

		remaining := quota
		for _, gift := range gifts {
			if remaining == 0 {
				break
			}
			used := min(remaining, gift.RemainingQuota)
			if err := tx.Model(&UserGiftQuota{}).Where("id = ?", gift.Id).
				Update("remaining_quota", gorm.Expr("remaining_quota - ?", used)).Error; err != nil {
				return err
			}
			allocation.GiftQuotas = append(allocation.GiftQuotas, relaycommon.GiftQuotaAllocation{
				GiftQuotaId: gift.Id,
				Quota:       used,
			})
			remaining -= used
		}

		if remaining > 0 {
			if err := tx.Model(&User{}).Where("id = ?", userId).
				Update("quota", gorm.Expr("quota - ?", remaining)).Error; err != nil {
				return err
			}
			allocation.RegularQuota = remaining
		}
		return nil
	})
	if err != nil {
		return relaycommon.WalletQuotaAllocation{}, err
	}
	if err := invalidateUserCache(userId); err != nil {
		common.SysLog("failed to invalidate user cache after wallet quota consumption: " + err.Error())
	}
	return allocation, nil
}

// RefundWalletQuota restores quota to the sources recorded in allocation.
func RefundWalletQuota(userId int, allocation *relaycommon.WalletQuotaAllocation, quota int) error {
	if allocation == nil || quota < 0 || quota > allocation.Total() {
		return errors.New("invalid wallet quota refund allocation")
	}
	if quota == 0 {
		return nil
	}

	refund := relaycommon.WalletQuotaAllocation{}
	remaining := quota
	refund.RegularQuota = min(remaining, allocation.RegularQuota)
	remaining -= refund.RegularQuota
	for i := len(allocation.GiftQuotas) - 1; i >= 0 && remaining > 0; i-- {
		gift := allocation.GiftQuotas[i]
		amount := min(remaining, gift.Quota)
		refund.GiftQuotas = append(refund.GiftQuotas, relaycommon.GiftQuotaAllocation{
			GiftQuotaId: gift.GiftQuotaId,
			Quota:       amount,
		})
		remaining -= amount
	}

	if err := DB.Transaction(func(tx *gorm.DB) error {
		var user User
		if err := lockForUpdate(tx).Select("id", "quota").Where("id = ?", userId).First(&user).Error; err != nil {
			return err
		}
		gifts := make(map[int64]UserGiftQuota, len(refund.GiftQuotas))
		giftRefunds := make(map[int64]int, len(refund.GiftQuotas))
		for _, item := range refund.GiftQuotas {
			gift, ok := gifts[item.GiftQuotaId]
			if !ok {
				if err := lockForUpdate(tx).Where("id = ? AND user_id = ?", item.GiftQuotaId, userId).First(&gift).Error; err != nil {
					return err
				}
				gifts[item.GiftQuotaId] = gift
			}
			giftRefunds[gift.Id] += item.Quota
			if item.Quota <= 0 || gift.RemainingQuota > gift.Quota-giftRefunds[gift.Id] {
				return errors.New("gift quota refund exceeds the original grant")
			}
		}
		if refund.RegularQuota > 0 {
			maxInt := int64(^uint(0) >> 1)
			if int64(user.Quota)+int64(refund.RegularQuota) > maxInt {
				return errors.New("regular quota refund is outside the supported range")
			}
			if err := tx.Model(&User{}).Where("id = ?", userId).
				Update("quota", gorm.Expr("quota + ?", refund.RegularQuota)).Error; err != nil {
				return err
			}
		}
		for giftId, amount := range giftRefunds {
			if err := tx.Model(&UserGiftQuota{}).Where("id = ?", giftId).
				Update("remaining_quota", gorm.Expr("remaining_quota + ?", amount)).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return err
	}

	allocation.RegularQuota -= refund.RegularQuota
	for _, item := range refund.GiftQuotas {
		for i := len(allocation.GiftQuotas) - 1; i >= 0; i-- {
			if allocation.GiftQuotas[i].GiftQuotaId != item.GiftQuotaId {
				continue
			}
			allocation.GiftQuotas[i].Quota -= item.Quota
			if allocation.GiftQuotas[i].Quota == 0 {
				allocation.GiftQuotas = append(allocation.GiftQuotas[:i], allocation.GiftQuotas[i+1:]...)
			}
			break
		}
	}
	if err := invalidateUserCache(userId); err != nil {
		common.SysLog("failed to invalidate user cache after wallet quota refund: " + err.Error())
	}
	return nil
}
