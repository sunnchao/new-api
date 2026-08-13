package common

import "github.com/gin-gonic/gin"

// GiftQuotaAllocation records quota consumed from one gift batch.
type GiftQuotaAllocation struct {
	GiftQuotaId int64 `json:"gift_quota_id"`
	Quota       int   `json:"quota"`
}

// WalletQuotaAllocation records the wallet sources used by one billing lifecycle.
type WalletQuotaAllocation struct {
	GiftQuotas   []GiftQuotaAllocation `json:"gift_quotas,omitempty"`
	RegularQuota int                   `json:"regular_quota,omitempty"`
}

// Total returns the quota represented by the allocation.
func (a WalletQuotaAllocation) Total() int {
	total := a.RegularQuota
	for _, gift := range a.GiftQuotas {
		total += gift.Quota
	}
	return total
}

// BillingSettler 抽象计费会话的生命周期操作。
// 由 service.BillingSession 实现，存储在 RelayInfo 上以避免循环引用。
type BillingSettler interface {
	// Settle 根据实际消耗额度进行结算，计算 delta = actualQuota - preConsumedQuota，
	// 同时调整资金来源（钱包/订阅）和令牌额度。
	Settle(actualQuota int) error

	// Refund 退还所有预扣费额度（资金来源 + 令牌），幂等安全。
	// 通过 gopool 异步执行。如果已经结算或退款则不做任何操作。
	Refund(c *gin.Context)

	// NeedsRefund 返回会话是否存在需要退还的预扣状态（未结算且未退款）。
	NeedsRefund() bool

	// GetPreConsumedQuota 返回实际预扣的额度值（信任用户可能为 0）。
	GetPreConsumedQuota() int

	// Reserve 将预扣额度补到目标值；若目标值不高于当前预扣额度则不做任何事。
	Reserve(targetQuota int) error

	// GetWalletQuotaAllocation 返回钱包计费的额度来源快照。
	GetWalletQuotaAllocation() WalletQuotaAllocation
}
