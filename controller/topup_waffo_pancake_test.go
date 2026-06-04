package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/stretchr/testify/require"
)

func TestFormatWaffoPancakeAmount_UsesDisplayPriceString(t *testing.T) {
	testCases := []struct {
		name     string
		amount   float64
		expected string
	}{
		{name: "whole amount", amount: 29, expected: "29.00"},
		{name: "decimal amount", amount: 29.9, expected: "29.90"},
		{name: "round half up to cents", amount: 29.999, expected: "30.00"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.expected, formatWaffoPancakeAmount(tc.amount))
		})
	}
}

func TestFormatWaffoPancakeUSDAmount_ConvertsDisplayCurrencyToUSD(t *testing.T) {
	originalQuotaDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	originalUSDExchangeRate := operation_setting.USDExchangeRate
	originalCustomExchangeRate := operation_setting.GetGeneralSetting().CustomCurrencyExchangeRate

	t.Cleanup(func() {
		operation_setting.GetGeneralSetting().QuotaDisplayType = originalQuotaDisplayType
		operation_setting.USDExchangeRate = originalUSDExchangeRate
		operation_setting.GetGeneralSetting().CustomCurrencyExchangeRate = originalCustomExchangeRate
	})

	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeCNY
	operation_setting.USDExchangeRate = 7.25
	require.Equal(t, "0.69", formatWaffoPancakeUSDAmount(5))

	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeUSD
	require.Equal(t, "5.00", formatWaffoPancakeUSDAmount(5))

	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeCustom
	operation_setting.GetGeneralSetting().CustomCurrencyExchangeRate = 2.5
	require.Equal(t, "2.00", formatWaffoPancakeUSDAmount(5))
}

func TestFormatWaffoPancakeUSDAmountString_ConvertsPlanPriceToUSD(t *testing.T) {
	originalQuotaDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	originalUSDExchangeRate := operation_setting.USDExchangeRate

	t.Cleanup(func() {
		operation_setting.GetGeneralSetting().QuotaDisplayType = originalQuotaDisplayType
		operation_setting.USDExchangeRate = originalUSDExchangeRate
	})

	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeCNY
	operation_setting.USDExchangeRate = 7.25

	amount, err := formatWaffoPancakeUSDAmountString("5")
	require.NoError(t, err)
	require.Equal(t, "0.69", amount)
}

func TestWaffoPancakeCNYTopUp_ConvertsFeeAdjustedDisplayAmountToUSD(t *testing.T) {
	originalUnitPrice := setting.WaffoPancakeUnitPrice
	originalQuotaDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	originalUSDExchangeRate := operation_setting.USDExchangeRate
	originalDiscounts := make(map[int]float64, len(operation_setting.GetPaymentSetting().AmountDiscount))
	for k, v := range operation_setting.GetPaymentSetting().AmountDiscount {
		originalDiscounts[k] = v
	}
	originalTopupGroupRatio := common.TopupGroupRatio2JSONString()

	t.Cleanup(func() {
		setting.WaffoPancakeUnitPrice = originalUnitPrice
		operation_setting.GetGeneralSetting().QuotaDisplayType = originalQuotaDisplayType
		operation_setting.USDExchangeRate = originalUSDExchangeRate
		operation_setting.GetPaymentSetting().AmountDiscount = originalDiscounts
		require.NoError(t, common.UpdateTopupGroupRatioByJSONString(originalTopupGroupRatio))
	})

	setting.WaffoPancakeUnitPrice = 1.01
	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeCNY
	operation_setting.USDExchangeRate = 6.5
	operation_setting.GetPaymentSetting().AmountDiscount = map[int]float64{}
	require.NoError(t, common.UpdateTopupGroupRatioByJSONString(`{"default":1}`))

	payMoney := getWaffoPancakePayMoney(5, "default")
	require.Equal(t, "5.05", formatWaffoPancakeAmount(payMoney))
	require.Equal(t, "0.78", formatWaffoPancakeUSDAmount(payMoney))
}

func TestGetWaffoPancakePayMoney(t *testing.T) {
	originalUnitPrice := setting.WaffoPancakeUnitPrice
	originalQuotaDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	originalDiscounts := make(map[int]float64, len(operation_setting.GetPaymentSetting().AmountDiscount))
	for k, v := range operation_setting.GetPaymentSetting().AmountDiscount {
		originalDiscounts[k] = v
	}
	originalTopupGroupRatio := common.TopupGroupRatio2JSONString()

	t.Cleanup(func() {
		setting.WaffoPancakeUnitPrice = originalUnitPrice
		operation_setting.GetGeneralSetting().QuotaDisplayType = originalQuotaDisplayType
		operation_setting.GetPaymentSetting().AmountDiscount = originalDiscounts
		require.NoError(t, common.UpdateTopupGroupRatioByJSONString(originalTopupGroupRatio))
	})

	setting.WaffoPancakeUnitPrice = 2.5
	operation_setting.GetPaymentSetting().AmountDiscount = map[int]float64{
		10:                           0.8,
		int(common.QuotaPerUnit * 3): 0.5,
		20:                           0,
	}
	require.NoError(t, common.UpdateTopupGroupRatioByJSONString(`{"default":1,"vip":1.2}`))

	testCases := []struct {
		name             string
		amount           int64
		group            string
		quotaDisplayType string
		expected         float64
	}{
		{
			name:             "currency display applies unit price group ratio and discount",
			amount:           10,
			group:            "vip",
			quotaDisplayType: operation_setting.QuotaDisplayTypeUSD,
			expected:         24,
		},
		{
			name:             "tokens display converts quota to display units before pricing",
			amount:           int64(common.QuotaPerUnit * 3),
			group:            "vip",
			quotaDisplayType: operation_setting.QuotaDisplayTypeTokens,
			expected:         4.5,
		},
		{
			name:             "non-positive discount falls back to no discount",
			amount:           20,
			group:            "default",
			quotaDisplayType: operation_setting.QuotaDisplayTypeUSD,
			expected:         50,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			operation_setting.GetGeneralSetting().QuotaDisplayType = tc.quotaDisplayType
			actual := getWaffoPancakePayMoney(tc.amount, tc.group)
			require.InDelta(t, tc.expected, actual, 0.000001)
		})
	}
}
