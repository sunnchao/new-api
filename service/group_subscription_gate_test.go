package service

import (
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func configureSubscriptionGatedGroups(t *testing.T, rules map[string]map[string]string) {
	t.Helper()
	originalUsableGroups := setting.UserUsableGroups2JSONString()
	specialGroups := ratio_setting.GetGroupRatioSetting().GroupSpecialUsableGroup
	originalRules := specialGroups.ReadAll()
	originalGroupBilling := ratio_setting.GroupModelBilling2JSONString()
	t.Cleanup(func() {
		require.NoError(t, setting.UpdateUserUsableGroupsByJSONString(originalUsableGroups))
		specialGroups.Clear()
		specialGroups.AddAll(originalRules)
		require.NoError(t, ratio_setting.UpdateGroupModelBillingByJSONString(originalGroupBilling))
	})
	require.NoError(t, setting.UpdateUserUsableGroupsByJSONString(`{"default":"Default","vip":"VIP"}`))
	specialGroups.Clear()
	specialGroups.AddAll(rules)
}

func TestSubscriptionGatedGroupUnlocksOnlyWithExplicitSubscription(t *testing.T) {
	runSubscriptionGatedGroupVisibilityCases(t)
}

func runSubscriptionGatedGroupVisibilityCases(t *testing.T) {
	t.Helper()
	t.Cleanup(func() { resetGroupBillingRecords(t) })
	configureSubscriptionGatedGroups(t, map[string]map[string]string{
		"default": {"sub:vip": "VIP by subscription"},
	})

	tests := []struct {
		name          string
		subscribed    bool
		allowedGroups string
		amountUsed    int64
		status        string
		expired       bool
		wantUnlocked  bool
	}{
		{name: "subscription listing the group unlocks it", subscribed: true, allowedGroups: "svip, vip", wantUnlocked: true},
		{name: "exhausted subscription still unlocks the group", subscribed: true, allowedGroups: "vip", amountUsed: 1000, wantUnlocked: true},
		{name: "all-groups subscription does not unlock", subscribed: true, allowedGroups: ""},
		{name: "subscription for another group does not unlock", subscribed: true, allowedGroups: "svip"},
		{name: "expired subscription does not unlock", subscribed: true, allowedGroups: "vip", expired: true},
		{name: "cancelled subscription does not unlock", subscribed: true, allowedGroups: "vip", status: "cancelled"},
		{name: "available plan without a purchased subscription does not unlock"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resetGroupBillingRecords(t)
			const userID = 1
			seedUser(t, userID, 0)
			seedSubscriptionPlan(t, 1, model.SubscriptionBillingModeQuota)
			planGroups := tt.allowedGroups
			if !tt.subscribed {
				planGroups = "vip"
			}
			require.NoError(t, model.DB.Model(&model.SubscriptionPlan{}).Where("id = ?", 1).
				Update("allowed_groups", planGroups).Error)
			if tt.subscribed {
				sub := &model.UserSubscription{
					Id:            1,
					UserId:        userID,
					PlanId:        1,
					AmountTotal:   1000,
					AmountUsed:    tt.amountUsed,
					BillingMode:   model.SubscriptionBillingModeQuota,
					AllowedGroups: tt.allowedGroups,
					Status:        tt.status,
				}
				if tt.expired {
					sub.EndTime = time.Now().Add(-time.Minute).Unix()
				}
				seedActiveSubscription(t, sub)
			}

			groups, err := GetUserUsableGroupsForUser(userID, "default")
			require.NoError(t, err)
			unlocked, err := IsGroupUnlockedBySubscription(userID, "default", "vip")
			require.NoError(t, err)

			assert.Equal(t, tt.wantUnlocked, unlocked)
			assert.Contains(t, groups, "default")
			if tt.wantUnlocked {
				assert.Equal(t, "VIP by subscription", groups["vip"])
				return
			}
			assert.NotContains(t, groups, "vip")
		})
	}
}

func TestSubscriptionGatedGroupRuleScope(t *testing.T) {
	configureSubscriptionGatedGroups(t, map[string]map[string]string{
		"default": {
			"+:vip":       "plain visibility",
			"sub:vip":     "by subscription",
			"sub:default": "own group",
		},
	})

	defaultGroups := GetUserUsableGroups("default")
	assert.NotContains(t, defaultGroups, "vip", "the subscription rule wins over a +: rule for the same group")
	assert.Contains(t, defaultGroups, "default", "a user's own group is never gated")
	assert.Contains(t, GetUserUsableGroups("other"), "vip", "rules only apply to their owner group")

	unlocked, err := IsGroupUnlockedBySubscription(1, "default", "default")
	require.NoError(t, err)
	assert.False(t, unlocked)
}

func TestNewBillingSessionGroupBillingDatabaseMatrix(t *testing.T) {
	for _, dialect := range []struct {
		name common.DatabaseType
		env  string
	}{
		{common.DatabaseTypeSQLite, ""},
		{common.DatabaseTypeMySQL, "TEST_GROUP_MYSQL_DSN"},
		{common.DatabaseTypePostgreSQL, "TEST_GROUP_POSTGRES_DSN"},
	} {
		t.Run(string(dialect.name), func(t *testing.T) {
			var driver gorm.Dialector = sqlite.Open(":memory:")
			if dialect.env != "" {
				dsn := os.Getenv(dialect.env)
				if dsn == "" {
					t.Skip(dialect.env + " must point to an isolated test database")
				}
				if dialect.name == common.DatabaseTypeMySQL {
					driver = mysql.Open(dsn)
				} else {
					driver = postgres.New(postgres.Config{DSN: dsn, PreferSimpleProtocol: true})
				}
			}
			db, err := gorm.Open(driver, &gorm.Config{})
			require.NoError(t, err)
			sqlDB, err := db.DB()
			require.NoError(t, err)
			sqlDB.SetMaxOpenConns(1)
			previousDB, previousLogDB := model.DB, model.LOG_DB
			previousMainType, previousLogType := common.MainDatabaseType(), common.LogDatabaseType()
			model.DB, model.LOG_DB = db, db
			common.SetDatabaseTypes(dialect.name, dialect.name)
			t.Cleanup(func() {
				model.DB, model.LOG_DB = previousDB, previousLogDB
				common.SetDatabaseTypes(previousMainType, previousLogType)
				require.NoError(t, sqlDB.Close())
			})
			require.NoError(t, db.AutoMigrate(&model.User{}, &model.Token{}, &model.UserGiftQuota{},
				&model.SubscriptionPlan{}, &model.UserSubscription{}, &model.SubscriptionPreConsumeRecord{}))
			versionQuery := "SELECT version()"
			if dialect.name == common.DatabaseTypeSQLite {
				versionQuery = "SELECT sqlite_version()"
			}
			var version string
			require.NoError(t, db.Raw(versionQuery).Scan(&version).Error)
			t.Logf("database version: %s", version)
			t.Run("subscription gate visibility", runSubscriptionGatedGroupVisibilityCases)
			t.Run("subscription gate funding independence", runSubscriptionGatedGroupFundingCases)
			t.Run("funding source precedence", runGroupBillingSourceCases)
		})
	}
}

func resetGroupBillingRecords(t *testing.T) {
	t.Helper()
	for _, record := range []any{&model.SubscriptionPreConsumeRecord{}, &model.UserSubscription{},
		&model.SubscriptionPlan{}, &model.Token{}, &model.UserGiftQuota{}, &model.User{}} {
		require.NoError(t, model.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(record).Error)
	}
}

func runSubscriptionGatedGroupFundingCases(t *testing.T) {
	t.Helper()
	const (
		userID      = 201
		walletQuota = 1_000_000
		needQuota   = 200
		planID      = 1
	)
	tests := []struct {
		name          string
		preference    string
		config        string
		subscriptions []model.UserSubscription
		wantSource    string
		wantUsed      map[int]int64
		wantErr       bool
	}{
		{
			name:          "unlocked group respects wallet first",
			preference:    "wallet_first",
			subscriptions: []model.UserSubscription{{Id: 1, AllowedGroups: "vip"}},
			wantSource:    BillingSourceWallet,
			wantUsed:      map[int]int64{1: 0},
		},
		{
			name:          "unlocked group respects wallet only even with an exhausted subscription",
			preference:    "wallet_only",
			subscriptions: []model.UserSubscription{{Id: 1, AllowedGroups: "vip", AmountTotal: needQuota - 1}},
			wantSource:    BillingSourceWallet,
			wantUsed:      map[int]int64{1: 0},
		},
		{
			name:          "unlocked group respects subscription first",
			preference:    "subscription_first",
			subscriptions: []model.UserSubscription{{Id: 1, AllowedGroups: "vip"}},
			wantSource:    BillingSourceSubscription,
			wantUsed:      map[int]int64{1: needQuota},
		},
		{
			name:          "unlocked group respects subscription only",
			preference:    "subscription_only",
			subscriptions: []model.UserSubscription{{Id: 1, AllowedGroups: "vip"}},
			wantSource:    BillingSourceSubscription,
			wantUsed:      map[int]int64{1: needQuota},
		},
		{
			name:       "unlocking does not exclude an earlier expiring all-groups subscription from payment",
			preference: "subscription_first",
			subscriptions: []model.UserSubscription{
				{Id: 1, AllowedGroups: "", EndTime: time.Now().Add(24 * time.Hour).Unix()},
				{Id: 2, AllowedGroups: "vip"},
			},
			wantSource: BillingSourceSubscription,
			wantUsed:   map[int]int64{1: needQuota, 2: 0},
		},
		{
			name:          "unlocked group retains enabled wallet overflow",
			preference:    "subscription_first",
			subscriptions: []model.UserSubscription{{Id: 1, AllowedGroups: "vip", AmountTotal: needQuota - 1, AllowWalletOverflow: true}},
			wantSource:    BillingSourceWallet,
			wantUsed:      map[int]int64{1: 0},
		},
		{
			name:          "unlocked group retains disabled wallet overflow",
			preference:    "subscription_first",
			subscriptions: []model.UserSubscription{{Id: 1, AllowedGroups: "vip", AmountTotal: needQuota - 1}},
			wantUsed:      map[int]int64{1: 0},
			wantErr:       true,
		},
		{
			name:          "group funding source remains effective after unlocking",
			preference:    "subscription_first",
			config:        `{"vip":{"__default__":{"billing_source":"wallet_only"}}}`,
			subscriptions: []model.UserSubscription{{Id: 1, AllowedGroups: "vip"}},
			wantSource:    BillingSourceWallet,
			wantUsed:      map[int]int64{1: 0},
		},
		{
			name:          "model funding source remains effective after unlocking",
			preference:    "wallet_first",
			config:        `{"vip":{"__default__":{"billing_source":"wallet_only"},"test-model":{"billing_source":"subscription_only"}}}`,
			subscriptions: []model.UserSubscription{{Id: 1, AllowedGroups: "vip"}},
			wantSource:    BillingSourceSubscription,
			wantUsed:      map[int]int64{1: needQuota},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resetGroupBillingRecords(t)
			configureSubscriptionGatedGroups(t, map[string]map[string]string{
				"default": {"sub:vip": "VIP by subscription"},
			})
			config := tt.config
			if config == "" {
				config = `{}`
			}
			require.NoError(t, ratio_setting.UpdateGroupModelBillingByJSONString(config))
			seedUser(t, userID, walletQuota)
			seedToken(t, userID, userID, "group-gated-key", 1000)
			seedSubscriptionPlan(t, planID, model.SubscriptionBillingModeQuota)
			for _, sub := range tt.subscriptions {
				sub.UserId = userID
				sub.PlanId = planID
				sub.BillingMode = model.SubscriptionBillingModeQuota
				if sub.AmountTotal == 0 {
					sub.AmountTotal = 1000
				}
				seedActiveSubscription(t, &sub)
			}
			groups, err := GetUserUsableGroupsForUser(userID, "default")
			require.NoError(t, err)
			require.Contains(t, groups, "vip", "visibility depends on the active subscription, not remaining quota")
			relayInfo := newBillingTestRelayInfo(userID, tt.preference)
			relayInfo.UserGroup = "default"
			relayInfo.UsingGroup = "vip"
			relayInfo.IsPlayground = false
			relayInfo.TokenUnlimited = false
			relayInfo.TokenId = userID
			relayInfo.TokenKey = "group-gated-key"

			_, apiErr := NewBillingSession(newBillingTestContext(), relayInfo, needQuota)

			if tt.wantErr {
				require.NotNil(t, apiErr)
				assert.Equal(t, types.ErrorCodeInsufficientUserQuota, apiErr.GetErrorCode())
				assert.Equal(t, http.StatusForbidden, apiErr.StatusCode)
			} else {
				require.Nil(t, apiErr)
				assert.Equal(t, tt.wantSource, relayInfo.BillingSource)
			}
			for id, wantUsed := range tt.wantUsed {
				var sub model.UserSubscription
				require.NoError(t, model.DB.First(&sub, id).Error)
				assert.Equal(t, wantUsed, sub.AmountUsed, "subscription %d", id)
			}
			var user model.User
			require.NoError(t, model.DB.First(&user, userID).Error)
			wantWalletQuota := walletQuota
			if tt.wantSource == BillingSourceWallet {
				wantWalletQuota -= needQuota
			}
			assert.Equal(t, wantWalletQuota, user.Quota)
			var token model.Token
			require.NoError(t, model.DB.First(&token, userID).Error)
			wantTokenRemaining := 1000 - needQuota
			if tt.wantErr {
				wantTokenRemaining = 1000
			}
			assert.Equal(t, wantTokenRemaining, token.RemainQuota)
			assert.Equal(t, 1000-wantTokenRemaining, token.UsedQuota)
		})
	}
}

func runGroupBillingSourceCases(t *testing.T) {
	t.Helper()
	const (
		userID      = 201
		walletQuota = 1_000_000
		needQuota   = 200
	)
	for _, test := range []struct {
		name           string
		config         string
		preference     string
		allowedGroups  string
		noSubscription bool
		wantSource     string
	}{
		{
			name: "unconfigured group uses user preference", config: `{}`,
			preference: "wallet_only", wantSource: BillingSourceWallet,
		},
		{
			name:       "another group's configuration does not override user preference",
			config:     `{"other":{"__default__":{"billing_source":"subscription_only"}}}`,
			preference: "wallet_only", wantSource: BillingSourceWallet,
		},
		{
			name:       "model source overrides group default and user preference",
			config:     `{"vip":{"__default__":{"billing_source":"wallet_only"},"test-model":{"billing_source":"subscription_only"}}}`,
			preference: "wallet_only", wantSource: BillingSourceSubscription,
		},
		{
			name:       "missing model source inherits group default",
			config:     `{"vip":{"__default__":{"billing_source":"subscription_only"}}}`,
			preference: "wallet_only", wantSource: BillingSourceSubscription,
		},
		{
			name:       "empty model source inherits group default",
			config:     `{"vip":{"__default__":{"billing_source":"wallet_only"},"test-model":{"billing_source":""}}}`,
			preference: "subscription_only", wantSource: BillingSourceWallet,
		},
		{
			name:       "legacy prices do not change funding source or reserved quota",
			config:     `{"vip":{"test-model":{"quota_type":1,"model_price":0.5}}}`,
			preference: "wallet_only", wantSource: BillingSourceWallet,
		},
		{
			name:       "empty sources retain user preference",
			config:     `{"vip":{"__default__":{"billing_source":""},"test-model":{"quota_type":1,"model_price":0.5}}}`,
			preference: "subscription_only", wantSource: BillingSourceSubscription,
		},
		{
			name:   "subscription only rejects missing subscription",
			config: `{}`, preference: "subscription_only", noSubscription: true,
		},
		{
			name:   "subscription only rejects subscription for another group",
			config: `{}`, preference: "subscription_only", allowedGroups: "svip",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			resetGroupBillingRecords(t)
			configureSubscriptionGatedGroups(t, nil)
			require.NoError(t, ratio_setting.UpdateGroupModelBillingByJSONString(test.config))
			seedUser(t, userID, walletQuota)
			if !test.noSubscription {
				seedSubscriptionPlan(t, 1, model.SubscriptionBillingModeQuota)
				seedActiveSubscription(t, &model.UserSubscription{
					Id: 1, UserId: userID, PlanId: 1, AmountTotal: 1000,
					BillingMode: model.SubscriptionBillingModeQuota, AllowedGroups: test.allowedGroups,
				})
			}
			relayInfo := newBillingTestRelayInfo(userID, test.preference)
			relayInfo.UserGroup = "default"
			relayInfo.UsingGroup = "vip"
			_, apiErr := NewBillingSession(newBillingTestContext(), relayInfo, needQuota)
			wantWalletQuota := walletQuota
			wantSubscriptionUsed := int64(0)
			if test.wantSource == "" {
				require.NotNil(t, apiErr)
				assert.Equal(t, types.ErrorCodeInsufficientUserQuota, apiErr.GetErrorCode())
				assert.Equal(t, http.StatusForbidden, apiErr.StatusCode)
				if test.noSubscription {
					assert.Equal(t, "未开通有效订阅套餐", apiErr.Error())
				} else {
					assert.Equal(t, "未包含有效的订阅套餐", apiErr.Error())
				}
			} else {
				require.Nil(t, apiErr)
				assert.Equal(t, test.wantSource, relayInfo.BillingSource)
				if test.wantSource == BillingSourceWallet {
					wantWalletQuota -= needQuota
				} else {
					wantSubscriptionUsed = needQuota
				}
			}
			var user model.User
			require.NoError(t, model.DB.First(&user, userID).Error)
			assert.Equal(t, wantWalletQuota, user.Quota)
			if !test.noSubscription {
				var sub model.UserSubscription
				require.NoError(t, model.DB.First(&sub, 1).Error)
				assert.Equal(t, wantSubscriptionUsed, sub.AmountUsed)
			}
		})
	}
}
