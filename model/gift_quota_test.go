package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWalletQuotaUsesExpiringGiftBeforePermanentGiftAndRegularQuota(t *testing.T) {
	truncateTables(t)
	user := &User{Id: 2101, Username: "gift_fefo", Quota: 100, Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	now := time.Now().UTC()
	permanent, err := GrantGiftQuota(DB, user.Id, GiftQuotaSourceCheckin, 1, 40, now, 0)
	require.NoError(t, err)
	_, err = GrantGiftQuota(DB, user.Id, GiftQuotaSourceCheckin, 1, 40, now, 0)
	require.Error(t, err)
	later, err := GrantGiftQuota(DB, user.Id, GiftQuotaSourceCheckin, 2, 30, now, now.Add(48*time.Hour).Unix())
	require.NoError(t, err)
	sooner, err := GrantGiftQuota(DB, user.Id, GiftQuotaSourceCheckin, 3, 20, now, now.Add(24*time.Hour).Unix())
	require.NoError(t, err)

	allocation, err := ConsumeWalletQuota(user.Id, 60)
	require.NoError(t, err)
	assert.Equal(t, 60, allocation.Total())
	assert.Equal(t, []int64{sooner.Id, later.Id, permanent.Id}, []int64{
		allocation.GiftQuotas[0].GiftQuotaId,
		allocation.GiftQuotas[1].GiftQuotaId,
		allocation.GiftQuotas[2].GiftQuotaId,
	})
	assert.Equal(t, []int{20, 30, 10}, []int{
		allocation.GiftQuotas[0].Quota,
		allocation.GiftQuotas[1].Quota,
		allocation.GiftQuotas[2].Quota,
	})
	assert.Zero(t, allocation.RegularQuota)

	require.NoError(t, RefundWalletQuota(user.Id, &allocation, 25))
	assert.Equal(t, 35, allocation.Total())

	var gifts []UserGiftQuota
	require.NoError(t, DB.Order("id").Find(&gifts).Error)
	remainingById := make(map[int64]int, len(gifts))
	for _, gift := range gifts {
		remainingById[gift.Id] = gift.RemainingQuota
	}
	assert.Equal(t, 0, remainingById[sooner.Id])
	assert.Equal(t, 15, remainingById[later.Id])
	assert.Equal(t, 40, remainingById[permanent.Id])

	balance, err := GetUserQuotaBalance(user.Id, time.Now().Unix())
	require.NoError(t, err)
	assert.Equal(t, UserQuotaBalance{Regular: 100, Gift: 55, Total: 155}, balance)
}

func TestExpiredGiftQuotaIsNotSpendableOrRestoredAsRegularQuota(t *testing.T) {
	truncateTables(t)
	user := &User{Id: 2102, Username: "gift_expired", Quota: 25, Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	grantedAt := time.Now().UTC().Add(-2 * time.Hour)
	gift, err := GrantGiftQuota(DB, user.Id, GiftQuotaSourceCheckin, 1, 50, grantedAt, grantedAt.Add(time.Hour).Unix())
	require.NoError(t, err)

	balance, err := GetUserQuotaBalance(user.Id, time.Now().Unix())
	require.NoError(t, err)
	assert.Equal(t, UserQuotaBalance{Regular: 25, Gift: 0, Total: 25}, balance)

	allocation, err := ConsumeWalletQuota(user.Id, 20)
	require.NoError(t, err)
	assert.Equal(t, 20, allocation.RegularQuota)
	assert.Empty(t, allocation.GiftQuotas)
	require.NoError(t, RefundWalletQuota(user.Id, &allocation, 20))

	var stored UserGiftQuota
	require.NoError(t, DB.First(&stored, gift.Id).Error)
	assert.Equal(t, 50, stored.RemainingQuota)
	var regularQuota int
	require.NoError(t, DB.Model(&User{}).Where("id = ?", user.Id).Select("quota").Scan(&regularQuota).Error)
	assert.Equal(t, 25, regularQuota)
}

func TestUserQuotaBalanceAllowsTotalAboveSingleChargeClamp(t *testing.T) {
	truncateTables(t)
	user := &User{Id: 2103, Username: "gift_total_limit", Quota: common.MaxQuota - 10, Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	now := time.Now().UTC()
	_, err := GrantGiftQuota(DB, user.Id, GiftQuotaSourceCheckin, 1, 20, now, 0)
	require.NoError(t, err)
	balance, err := GetUserQuotaBalance(user.Id, now.Unix())
	require.NoError(t, err)
	assert.Equal(t, common.MaxQuota-10, balance.Regular)
	assert.Equal(t, 20, balance.Gift)
	assert.Equal(t, common.MaxQuota+10, balance.Total)
	cached, err := GetUserCache(user.Id)
	require.NoError(t, err)
	assert.Equal(t, common.MaxQuota+10, cached.Quota)
}

func TestGetUserGiftQuotaHistoryOrdersAndPaginatesOnlyOwnGrants(t *testing.T) {
	truncateTables(t)
	records := []UserGiftQuota{
		{UserId: 2201, Source: GiftQuotaSourceCheckin, SourceId: 1, Quota: 10, RemainingQuota: 0, CreatedAt: 100, ExpiresAt: 0},
		{UserId: 2201, Source: GiftQuotaSourceTopupBonus, SourceId: 2, Quota: 20, RemainingQuota: 20, CreatedAt: 200, ExpiresAt: 500},
		{UserId: 2201, Source: GiftQuotaSourceCheckin, SourceId: 3, Quota: 30, RemainingQuota: 30, CreatedAt: 200, ExpiresAt: 600},
		{UserId: 2202, Source: GiftQuotaSourceCheckin, SourceId: 4, Quota: 40, RemainingQuota: 40, CreatedAt: 300, ExpiresAt: 0},
	}
	require.NoError(t, DB.Create(&records).Error)

	firstPage, total, err := GetUserGiftQuotaHistory(2201, 0, 2)
	require.NoError(t, err)
	assert.Equal(t, int64(3), total)
	require.Len(t, firstPage, 2)
	assert.Equal(t, records[2].Id, firstPage[0].Id)
	assert.Equal(t, records[1].Id, firstPage[1].Id)
	assert.Equal(t, GiftQuotaSourceCheckin, firstPage[0].Source)
	assert.Equal(t, 30, firstPage[0].Quota)
	assert.Equal(t, int64(600), firstPage[0].ExpiresAt)

	secondPage, total, err := GetUserGiftQuotaHistory(2201, 2, 2)
	require.NoError(t, err)
	assert.Equal(t, int64(3), total)
	require.Len(t, secondPage, 1)
	assert.Equal(t, records[0].Id, secondPage[0].Id)
}
