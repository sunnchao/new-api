package dto

// AdminTokenCreateRequest 用于管理员创建令牌时显式指定归属用户。
type AdminTokenCreateRequest struct {
	UserID             *int    `json:"user_id,omitempty"`
	Name               string  `json:"name"`
	ExpiredTime        int64   `json:"expired_time"`
	RemainQuota        int     `json:"remain_quota"`
	UnlimitedQuota     bool    `json:"unlimited_quota"`
	ModelLimitsEnabled bool    `json:"model_limits_enabled"`
	ModelLimits        string  `json:"model_limits"`
	MjModel            string  `json:"mj_model"`
	AllowIps           *string `json:"allow_ips"`
	Group              string  `json:"group"`
	CrossGroupRetry    bool    `json:"cross_group_retry"`
	BackupGroup        string  `json:"backup_group"`
}

// AdminTokenUpdateRequest 用于管理员更新令牌时校验归属用户不可变。
type AdminTokenUpdateRequest struct {
	Id                 int     `json:"id"`
	UserID             *int    `json:"user_id,omitempty"`
	Status             int     `json:"status"`
	Name               string  `json:"name"`
	ExpiredTime        int64   `json:"expired_time"`
	RemainQuota        int     `json:"remain_quota"`
	UnlimitedQuota     bool    `json:"unlimited_quota"`
	ModelLimitsEnabled bool    `json:"model_limits_enabled"`
	ModelLimits        string  `json:"model_limits"`
	MjModel            string  `json:"mj_model"`
	AllowIps           *string `json:"allow_ips"`
	Group              string  `json:"group"`
	CrossGroupRetry    bool    `json:"cross_group_retry"`
	BackupGroup        string  `json:"backup_group"`
}
