package model

import (
	"fmt"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func insertUserForCheckinTest(t *testing.T, id int) {
	t.Helper()
	user := &User{
		Id:       id,
		Username: fmt.Sprintf("checkin_user_%d", id),
		Status:   common.UserStatusEnabled,
		Quota:    0,
		Group:    "default",
		AffCode:  fmt.Sprintf("checkin_aff_%d", id),
	}
	require.NoError(t, DB.Create(user).Error)
}

func enableCheckinForTest(t *testing.T) {
	t.Helper()
	setting := operation_setting.GetCheckinSetting()
	original := *setting
	setting.Enabled = true
	setting.MinQuota = 10
	setting.MaxQuota = 10
	t.Cleanup(func() {
		*setting = original
	})
}

func TestUserCheckinRejectsSameIPToday(t *testing.T) {
	truncateTables(t)
	enableCheckinForTest(t)
	insertUserForCheckinTest(t, 1001)
	insertUserForCheckinTest(t, 1002)

	first, err := UserCheckin(1001, "203.0.113.10")
	require.NoError(t, err)
	assert.Equal(t, "203.0.113.10", first.RequestIP)

	second, err := UserCheckin(1002, "203.0.113.10")
	require.Error(t, err)
	assert.Nil(t, second)
	assert.EqualError(t, err, "今日已签到")

	var count int64
	require.NoError(t, DB.Model(&Checkin{}).Count(&count).Error)
	assert.Equal(t, int64(1), count)
	assert.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 1002))
}
