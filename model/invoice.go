package model

import (
	"errors"
	"net/mail"
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	InvoiceTypePersonal = "personal"
	InvoiceTypeCompany  = "company"

	InvoiceProfileSourceManual   = "manual"
	InvoiceProfileSourceVerified = "verified"

	InvoiceStatusPending   = "pending"
	InvoiceStatusApproved  = "approved"
	InvoiceStatusRejected  = "rejected"
	InvoiceStatusIssued    = "issued"
	InvoiceStatusCancelled = "cancelled"

	InvoiceCurrencyUSD      = "USD"
	MaxInvoiceTopUpItemSize = 50

	InvoiceSourceTypeTopUp             = "topup"
	InvoiceSourceTypeSubscriptionOrder = "subscription_order"

	InvoiceAllowSubscriptionRecordsOption = "InvoiceAllowSubscriptionRecordsEnabled"
)

var invoiceablePaymentProviders = []string{
	PaymentProviderEpay,
	PaymentProviderStripe,
	PaymentProviderCreem,
	PaymentProviderWaffo,
	PaymentProviderWaffoPancake,
}

var (
	ErrInvoiceTopUpRequired                   = errors.New("invoice top-up ids are required")
	ErrInvoiceTopUpLimitExceeded              = errors.New("invoice top-up selection exceeds limit")
	ErrInvoiceTopUpNotInvoiceable             = errors.New("selected top-up is not invoiceable")
	ErrInvoiceTopUpAlreadyUsed                = errors.New("selected top-up has already been used")
	ErrInvoiceSourceInvalid                   = errors.New("selected invoice source is invalid")
	ErrInvoiceSubscriptionRecordsDisabled     = errors.New("subscription invoice records are disabled")
	ErrInvoiceSubscriptionOrderNotInvoiceable = errors.New("selected subscription order is not invoiceable")
	ErrInvoiceSubscriptionOrderAlreadyUsed    = errors.New("selected subscription order has already been used")
	ErrInvoiceTypeInvalid                     = errors.New("invoice type must be personal or company")
	ErrInvoiceTitleRequired                   = errors.New("invoice title is required")
	ErrInvoiceTaxNoRequired                   = errors.New("company invoice requires tax number")
	ErrInvoiceEmailInvalid                    = errors.New("invoice email is invalid")
	ErrInvoiceNotFound                        = errors.New("invoice request not found")
	ErrInvoiceStatusTransition                = errors.New("invoice status transition is not allowed")
	ErrInvoiceRejectReasonRequired            = errors.New("reject reason is required")
	ErrInvoiceNumberRequired                  = errors.New("invoice number is required")
)

type InvoiceRequest struct {
	Id                     int                              `json:"id"`
	UserId                 int                              `json:"user_id" gorm:"index;not null"`
	Username               string                           `json:"username" gorm:"type:varchar(128);not null;default:'';index"`
	InvoiceType            string                           `json:"invoice_type" gorm:"type:varchar(16);not null;index"`
	ProfileSource          string                           `json:"profile_source" gorm:"type:varchar(16);not null;default:'manual'"`
	RealNameVerificationId *int                             `json:"realname_verification_id" gorm:"index"`
	Title                  string                           `json:"title" gorm:"type:varchar(255);not null"`
	TaxNo                  string                           `json:"tax_no" gorm:"type:varchar(64);not null;default:'';index"`
	Email                  string                           `json:"email" gorm:"type:varchar(255);not null;default:''"`
	Phone                  string                           `json:"phone" gorm:"type:varchar(64);not null;default:''"`
	Amount                 float64                          `json:"amount" gorm:"type:decimal(10,2);not null;default:0"`
	Currency               string                           `json:"currency" gorm:"type:varchar(8);not null;default:'USD'"`
	Status                 string                           `json:"status" gorm:"type:varchar(16);not null;index"`
	Remark                 string                           `json:"remark" gorm:"type:text;not null"`
	RejectReason           string                           `json:"reject_reason" gorm:"type:text;not null"`
	InvoiceNo              string                           `json:"invoice_no" gorm:"type:varchar(128);not null;default:''"`
	InvoiceUrl             string                           `json:"invoice_url" gorm:"type:text;not null"`
	IssueNote              string                           `json:"issue_note" gorm:"type:text;not null"`
	IssuedAt               int64                            `json:"issued_at" gorm:"bigint;not null;default:0"`
	ReviewedBy             int                              `json:"reviewed_by" gorm:"index;not null;default:0"`
	ReviewedAt             int64                            `json:"reviewed_at" gorm:"bigint;not null;default:0"`
	CreatedAt              int64                            `json:"created_at" gorm:"bigint;index"`
	UpdatedAt              int64                            `json:"updated_at" gorm:"bigint"`
	Items                  []InvoiceRequestItem             `json:"items,omitempty" gorm:"foreignKey:InvoiceRequestId"`
	SubscriptionItems      []InvoiceRequestSubscriptionItem `json:"subscription_items,omitempty" gorm:"foreignKey:InvoiceRequestId"`
}

func (r *InvoiceRequest) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	r.CreatedAt = now
	r.UpdatedAt = now
	if r.Currency == "" {
		r.Currency = InvoiceCurrencyUSD
	}
	if r.Status == "" {
		r.Status = InvoiceStatusPending
	}
	if r.ProfileSource == "" {
		r.ProfileSource = InvoiceProfileSourceManual
	}
	return nil
}

func (r *InvoiceRequest) BeforeUpdate(tx *gorm.DB) error {
	r.UpdatedAt = common.GetTimestamp()
	return nil
}

type InvoiceRequestItem struct {
	Id                int     `json:"id"`
	InvoiceRequestId  int     `json:"invoice_request_id" gorm:"index;not null"`
	TopUpId           int     `json:"topup_id" gorm:"column:topup_id;uniqueIndex;not null"`
	TradeNo           string  `json:"trade_no" gorm:"type:varchar(255);not null;index"`
	Money             float64 `json:"money" gorm:"type:decimal(10,2);not null;default:0"`
	PaymentProvider   string  `json:"payment_provider" gorm:"type:varchar(50);not null;default:''"`
	PaymentMethod     string  `json:"payment_method" gorm:"type:varchar(50);not null;default:''"`
	TopUpCreateTime   int64   `json:"topup_create_time" gorm:"column:topup_create_time;bigint;not null;default:0"`
	TopUpCompleteTime int64   `json:"topup_complete_time" gorm:"column:topup_complete_time;bigint;not null;default:0"`
	CreatedAt         int64   `json:"created_at" gorm:"bigint"`
}

func (i *InvoiceRequestItem) BeforeCreate(tx *gorm.DB) error {
	i.CreatedAt = common.GetTimestamp()
	return nil
}

type InvoiceRequestSubscriptionItem struct {
	Id                       int     `json:"id"`
	InvoiceRequestId         int     `json:"invoice_request_id" gorm:"index;not null"`
	SubscriptionOrderId      int     `json:"subscription_order_id" gorm:"uniqueIndex;not null"`
	TradeNo                  string  `json:"trade_no" gorm:"type:varchar(255);not null;index"`
	Money                    float64 `json:"money" gorm:"type:decimal(10,2);not null;default:0"`
	PaymentProvider          string  `json:"payment_provider" gorm:"type:varchar(50);not null;default:''"`
	PaymentMethod            string  `json:"payment_method" gorm:"type:varchar(50);not null;default:''"`
	SubscriptionCreateTime   int64   `json:"subscription_create_time" gorm:"bigint;not null;default:0"`
	SubscriptionCompleteTime int64   `json:"subscription_complete_time" gorm:"bigint;not null;default:0"`
	CreatedAt                int64   `json:"created_at" gorm:"bigint"`
}

func (i *InvoiceRequestSubscriptionItem) BeforeCreate(tx *gorm.DB) error {
	i.CreatedAt = common.GetTimestamp()
	return nil
}

type UserInvoiceProfile struct {
	Id                     int    `json:"id"`
	UserId                 int    `json:"user_id" gorm:"index;uniqueIndex:idx_user_invoice_profile_type;not null"`
	InvoiceType            string `json:"invoice_type" gorm:"type:varchar(16);uniqueIndex:idx_user_invoice_profile_type;not null"`
	Source                 string `json:"source" gorm:"type:varchar(16);not null;default:'manual'"`
	RealNameVerificationId *int   `json:"realname_verification_id" gorm:"index"`
	Title                  string `json:"title" gorm:"type:varchar(255);not null;default:''"`
	TaxNo                  string `json:"tax_no" gorm:"type:varchar(64);not null;default:''"`
	Email                  string `json:"email" gorm:"type:varchar(255);not null;default:''"`
	Phone                  string `json:"phone" gorm:"type:varchar(64);not null;default:''"`
	BankName               string `json:"bank_name" gorm:"type:varchar(255);not null;default:''"`
	BankAccount            string `json:"bank_account" gorm:"type:varchar(128);not null;default:''"`
	RegisteredAddress      string `json:"registered_address" gorm:"type:varchar(255);not null;default:''"`
	RegisteredPhone        string `json:"registered_phone" gorm:"type:varchar(64);not null;default:''"`
	IsDefault              bool   `json:"is_default" gorm:"default:true"`
	CreatedAt              int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt              int64  `json:"updated_at" gorm:"bigint"`
}

func (p *UserInvoiceProfile) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	p.CreatedAt = now
	p.UpdatedAt = now
	if p.Source == "" {
		p.Source = InvoiceProfileSourceManual
	}
	p.IsDefault = true
	return nil
}

func (p *UserInvoiceProfile) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = common.GetTimestamp()
	return nil
}

type InvoiceCreateInput struct {
	UserId      int
	Username    string
	TopUpIds    []int
	Items       []InvoiceCreateItem
	InvoiceType string
	Title       string
	TaxNo       string
	Email       string
	Phone       string
	Remark      string
}

type InvoiceCreateItem struct {
	SourceType string `json:"source_type"`
	SourceId   int    `json:"source_id"`
}

type InvoiceEligibleRecord struct {
	Id              int     `json:"id"`
	SourceType      string  `json:"source_type"`
	SourceId        int     `json:"source_id"`
	UserId          int     `json:"user_id"`
	Amount          int64   `json:"amount"`
	Money           float64 `json:"money"`
	TradeNo         string  `json:"trade_no"`
	PaymentMethod   string  `json:"payment_method"`
	PaymentProvider string  `json:"payment_provider"`
	CreateTime      int64   `json:"create_time"`
	CompleteTime    int64   `json:"complete_time"`
	Status          string  `json:"status"`
	PlanId          int     `json:"plan_id,omitempty"`
}

type InvoiceIssueInput struct {
	InvoiceNo  string `json:"invoice_no"`
	InvoiceUrl string `json:"invoice_url"`
	IssuedAt   int64  `json:"issued_at"`
	IssueNote  string `json:"issue_note"`
}

func NormalizeInvoiceType(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func IsValidInvoiceType(value string) bool {
	value = NormalizeInvoiceType(value)
	return value == InvoiceTypePersonal || value == InvoiceTypeCompany
}

func InvoiceSubscriptionRecordsEnabled() bool {
	common.OptionMapRWMutex.RLock()
	defer common.OptionMapRWMutex.RUnlock()
	return common.OptionMap[InvoiceAllowSubscriptionRecordsOption] == "true"
}

func normalizeInvoiceCreateItems(input InvoiceCreateInput) ([]InvoiceCreateItem, error) {
	items := make([]InvoiceCreateItem, 0, len(input.Items)+len(input.TopUpIds))
	seen := make(map[string]struct{})
	for _, id := range input.TopUpIds {
		item := InvoiceCreateItem{SourceType: InvoiceSourceTypeTopUp, SourceId: id}
		key := item.SourceType + ":" + common.Interface2String(item.SourceId)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		items = append(items, item)
	}
	for _, item := range input.Items {
		item.SourceType = strings.ToLower(strings.TrimSpace(item.SourceType))
		if item.SourceType == "" {
			item.SourceType = InvoiceSourceTypeTopUp
		}
		if item.SourceId <= 0 {
			return nil, ErrInvoiceSourceInvalid
		}
		switch item.SourceType {
		case InvoiceSourceTypeTopUp, InvoiceSourceTypeSubscriptionOrder:
		default:
			return nil, ErrInvoiceSourceInvalid
		}
		key := item.SourceType + ":" + common.Interface2String(item.SourceId)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		items = append(items, item)
	}
	return items, nil
}

func validateInvoiceCreateInput(input InvoiceCreateInput) error {
	items, err := normalizeInvoiceCreateItems(input)
	if err != nil {
		return err
	}
	if len(items) == 0 {
		return ErrInvoiceTopUpRequired
	}
	if len(items) > MaxInvoiceTopUpItemSize {
		return ErrInvoiceTopUpLimitExceeded
	}
	if !InvoiceSubscriptionRecordsEnabled() {
		for _, item := range items {
			if item.SourceType == InvoiceSourceTypeSubscriptionOrder {
				return ErrInvoiceSubscriptionRecordsDisabled
			}
		}
	}
	if !IsValidInvoiceType(input.InvoiceType) {
		return ErrInvoiceTypeInvalid
	}
	if strings.TrimSpace(input.Title) == "" {
		return ErrInvoiceTitleRequired
	}
	if NormalizeInvoiceType(input.InvoiceType) == InvoiceTypeCompany && strings.TrimSpace(input.TaxNo) == "" {
		return ErrInvoiceTaxNoRequired
	}
	if strings.TrimSpace(input.Email) != "" {
		if _, err := mail.ParseAddress(strings.TrimSpace(input.Email)); err != nil {
			return ErrInvoiceEmailInvalid
		}
	}
	return nil
}

func invoiceableTopUpBaseQuery(tx *gorm.DB, userID int) *gorm.DB {
	return tx.Model(&TopUp{}).
		Where("user_id = ?", userID).
		Where("status = ?", common.TopUpStatusSuccess).
		Where("amount > 0").
		Where("money > 0").
		Where("payment_provider IN ?", invoiceablePaymentProviders)
}

func invoiceableTopUpQuery(tx *gorm.DB, userID int) *gorm.DB {
	usedSubQuery := tx.Model(&InvoiceRequestItem{}).Select("topup_id")
	return invoiceableTopUpBaseQuery(tx, userID).
		Where("id NOT IN (?)", usedSubQuery)
}

func invoiceableSubscriptionOrderBaseQuery(tx *gorm.DB, userID int) *gorm.DB {
	return tx.Model(&SubscriptionOrder{}).
		Where("user_id = ?", userID).
		Where("status = ?", common.TopUpStatusSuccess).
		Where("money > 0")
}

func invoiceableSubscriptionOrderQuery(tx *gorm.DB, userID int) *gorm.DB {
	usedSubQuery := tx.Model(&InvoiceRequestSubscriptionItem{}).Select("subscription_order_id")
	return invoiceableSubscriptionOrderBaseQuery(tx, userID).
		Where("id NOT IN (?)", usedSubQuery)
}

func ListEligibleInvoiceTopUps(userID int, keyword string, offset int, limit int) ([]TopUp, int64, error) {
	var total int64
	query := invoiceableTopUpQuery(DB, userID)
	if strings.TrimSpace(keyword) != "" {
		like := "%" + strings.TrimSpace(keyword) + "%"
		query = query.Where("trade_no LIKE ? OR payment_provider LIKE ? OR payment_method LIKE ?", like, like, like)
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []TopUp
	if err := query.Order("id desc").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func ListEligibleInvoiceRecords(userID int, keyword string, offset int, limit int) ([]InvoiceEligibleRecord, int64, error) {
	records := make([]InvoiceEligibleRecord, 0)
	keyword = strings.TrimSpace(keyword)
	topUpQuery := invoiceableTopUpQuery(DB, userID)
	if keyword != "" {
		like := "%" + keyword + "%"
		topUpQuery = topUpQuery.Where("trade_no LIKE ? OR payment_provider LIKE ? OR payment_method LIKE ?", like, like, like)
	}

	var topUps []TopUp
	if err := topUpQuery.Find(&topUps).Error; err != nil {
		return nil, 0, err
	}
	for _, topUp := range topUps {
		records = append(records, invoiceEligibleRecordFromTopUp(topUp))
	}

	if InvoiceSubscriptionRecordsEnabled() {
		subscriptionQuery := invoiceableSubscriptionOrderQuery(DB, userID)
		if keyword != "" {
			like := "%" + keyword + "%"
			subscriptionQuery = subscriptionQuery.Where("trade_no LIKE ? OR payment_provider LIKE ? OR payment_method LIKE ?", like, like, like)
		}
		var orders []SubscriptionOrder
		if err := subscriptionQuery.Find(&orders).Error; err != nil {
			return nil, 0, err
		}
		for _, order := range orders {
			records = append(records, invoiceEligibleRecordFromSubscriptionOrder(order))
		}
	}

	sort.SliceStable(records, func(i int, j int) bool {
		if records[i].CompleteTime != records[j].CompleteTime {
			return records[i].CompleteTime > records[j].CompleteTime
		}
		if records[i].CreateTime != records[j].CreateTime {
			return records[i].CreateTime > records[j].CreateTime
		}
		return records[i].Id > records[j].Id
	})

	total := int64(len(records))
	if offset < 0 {
		offset = 0
	}
	if limit <= 0 {
		return records, total, nil
	}
	if offset >= len(records) {
		return []InvoiceEligibleRecord{}, total, nil
	}
	end := offset + limit
	if end > len(records) {
		end = len(records)
	}
	return records[offset:end], total, nil
}

func invoiceEligibleRecordFromTopUp(topUp TopUp) InvoiceEligibleRecord {
	return InvoiceEligibleRecord{
		Id:              topUp.Id,
		SourceType:      InvoiceSourceTypeTopUp,
		SourceId:        topUp.Id,
		UserId:          topUp.UserId,
		Amount:          topUp.Amount,
		Money:           topUp.Money,
		TradeNo:         topUp.TradeNo,
		PaymentMethod:   topUp.PaymentMethod,
		PaymentProvider: topUp.PaymentProvider,
		CreateTime:      topUp.CreateTime,
		CompleteTime:    topUp.CompleteTime,
		Status:          topUp.Status,
	}
}

func invoiceEligibleRecordFromSubscriptionOrder(order SubscriptionOrder) InvoiceEligibleRecord {
	return InvoiceEligibleRecord{
		Id:              order.Id,
		SourceType:      InvoiceSourceTypeSubscriptionOrder,
		SourceId:        order.Id,
		UserId:          order.UserId,
		Amount:          0,
		Money:           order.Money,
		TradeNo:         order.TradeNo,
		PaymentMethod:   order.PaymentMethod,
		PaymentProvider: normalizeInvoicePaymentProvider(order.PaymentProvider, order.PaymentMethod),
		CreateTime:      order.CreateTime,
		CompleteTime:    order.CompleteTime,
		Status:          order.Status,
		PlanId:          order.PlanId,
	}
}

func normalizeInvoicePaymentProvider(paymentProvider string, paymentMethod string) string {
	trimmed := strings.TrimSpace(paymentProvider)
	if trimmed == "" || strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[") {
		return strings.TrimSpace(paymentMethod)
	}
	return trimmed
}

func loadDefaultInvoiceProfile(tx *gorm.DB, userID int, invoiceType string) (*UserInvoiceProfile, error) {
	var profile UserInvoiceProfile
	err := tx.Where("user_id = ? AND invoice_type = ? AND is_default = ?", userID, invoiceType, true).First(&profile).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func CreateInvoiceRequest(input InvoiceCreateInput) (*InvoiceRequest, error) {
	input.InvoiceType = NormalizeInvoiceType(input.InvoiceType)
	input.Title = strings.TrimSpace(input.Title)
	input.TaxNo = strings.TrimSpace(input.TaxNo)
	input.Email = strings.TrimSpace(input.Email)
	input.Phone = strings.TrimSpace(input.Phone)
	input.Remark = strings.TrimSpace(input.Remark)

	if err := validateInvoiceCreateInput(input); err != nil {
		return nil, err
	}
	items, err := normalizeInvoiceCreateItems(input)
	if err != nil {
		return nil, err
	}
	topUpIds, subscriptionOrderIds := splitInvoiceCreateItemIds(items)

	var created InvoiceRequest
	err = DB.Transaction(func(tx *gorm.DB) error {
		var usedTopUpCount int64
		if len(topUpIds) > 0 {
			if err := tx.Model(&InvoiceRequestItem{}).Where("topup_id IN ?", topUpIds).Count(&usedTopUpCount).Error; err != nil {
				return err
			}
		}
		if usedTopUpCount > 0 {
			return ErrInvoiceTopUpAlreadyUsed
		}

		var usedSubscriptionOrderCount int64
		if len(subscriptionOrderIds) > 0 {
			if err := tx.Model(&InvoiceRequestSubscriptionItem{}).Where("subscription_order_id IN ?", subscriptionOrderIds).Count(&usedSubscriptionOrderCount).Error; err != nil {
				return err
			}
		}
		if usedSubscriptionOrderCount > 0 {
			return ErrInvoiceSubscriptionOrderAlreadyUsed
		}

		topUps, err := loadInvoiceableTopUpsByIds(tx, input.UserId, topUpIds)
		if err != nil {
			return err
		}
		subscriptionOrders, err := loadInvoiceableSubscriptionOrdersByIds(tx, input.UserId, subscriptionOrderIds)
		if err != nil {
			return err
		}

		profile, err := loadDefaultInvoiceProfile(tx, input.UserId, input.InvoiceType)
		if err != nil {
			return err
		}

		profileSource := InvoiceProfileSourceManual
		var verificationID *int
		if profile != nil && profile.Source == InvoiceProfileSourceVerified {
			profileSource = InvoiceProfileSourceVerified
			verificationID = profile.RealNameVerificationId
		}

		total := 0.0
		for _, topUp := range topUps {
			total += topUp.Money
		}
		for _, order := range subscriptionOrders {
			total += order.Money
		}

		created = InvoiceRequest{
			UserId:                 input.UserId,
			Username:               input.Username,
			InvoiceType:            input.InvoiceType,
			ProfileSource:          profileSource,
			RealNameVerificationId: verificationID,
			Title:                  input.Title,
			TaxNo:                  input.TaxNo,
			Email:                  input.Email,
			Phone:                  input.Phone,
			Amount:                 total,
			Currency:               InvoiceCurrencyUSD,
			Status:                 InvoiceStatusPending,
			Remark:                 input.Remark,
		}
		if err := tx.Create(&created).Error; err != nil {
			return err
		}

		for _, topUp := range topUps {
			item := InvoiceRequestItem{
				InvoiceRequestId:  created.Id,
				TopUpId:           topUp.Id,
				TradeNo:           topUp.TradeNo,
				Money:             topUp.Money,
				PaymentProvider:   topUp.PaymentProvider,
				PaymentMethod:     topUp.PaymentMethod,
				TopUpCreateTime:   topUp.CreateTime,
				TopUpCompleteTime: topUp.CompleteTime,
			}
			if err := tx.Create(&item).Error; err != nil {
				if isInvoiceUniqueConflict(err) {
					return ErrInvoiceTopUpAlreadyUsed
				}
				return err
			}
		}
		for _, order := range subscriptionOrders {
			item := InvoiceRequestSubscriptionItem{
				InvoiceRequestId:         created.Id,
				SubscriptionOrderId:      order.Id,
				TradeNo:                  order.TradeNo,
				Money:                    order.Money,
				PaymentProvider:          normalizeInvoicePaymentProvider(order.PaymentProvider, order.PaymentMethod),
				PaymentMethod:            order.PaymentMethod,
				SubscriptionCreateTime:   order.CreateTime,
				SubscriptionCompleteTime: order.CompleteTime,
			}
			if err := tx.Create(&item).Error; err != nil {
				if isInvoiceUniqueConflict(err) {
					return ErrInvoiceSubscriptionOrderAlreadyUsed
				}
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &created, nil
}

func splitInvoiceCreateItemIds(items []InvoiceCreateItem) ([]int, []int) {
	topUpIds := make([]int, 0, len(items))
	subscriptionOrderIds := make([]int, 0, len(items))
	for _, item := range items {
		switch item.SourceType {
		case InvoiceSourceTypeTopUp:
			topUpIds = append(topUpIds, item.SourceId)
		case InvoiceSourceTypeSubscriptionOrder:
			subscriptionOrderIds = append(subscriptionOrderIds, item.SourceId)
		}
	}
	return topUpIds, subscriptionOrderIds
}

func loadInvoiceableTopUpsByIds(tx *gorm.DB, userID int, ids []int) ([]TopUp, error) {
	if len(ids) == 0 {
		return []TopUp{}, nil
	}
	var topUps []TopUp
	if err := invoiceableTopUpBaseQuery(tx, userID).Where("id IN ?", ids).Find(&topUps).Error; err != nil {
		return nil, err
	}
	if len(topUps) != len(ids) {
		return nil, ErrInvoiceTopUpNotInvoiceable
	}
	topUpById := make(map[int]TopUp, len(topUps))
	for _, topUp := range topUps {
		topUpById[topUp.Id] = topUp
	}
	ordered := make([]TopUp, 0, len(ids))
	for _, id := range ids {
		topUp, ok := topUpById[id]
		if !ok {
			return nil, ErrInvoiceTopUpNotInvoiceable
		}
		ordered = append(ordered, topUp)
	}
	return ordered, nil
}

func loadInvoiceableSubscriptionOrdersByIds(tx *gorm.DB, userID int, ids []int) ([]SubscriptionOrder, error) {
	if len(ids) == 0 {
		return []SubscriptionOrder{}, nil
	}
	if !InvoiceSubscriptionRecordsEnabled() {
		return nil, ErrInvoiceSubscriptionRecordsDisabled
	}
	var orders []SubscriptionOrder
	if err := invoiceableSubscriptionOrderBaseQuery(tx, userID).Where("id IN ?", ids).Find(&orders).Error; err != nil {
		return nil, err
	}
	if len(orders) != len(ids) {
		return nil, ErrInvoiceSubscriptionOrderNotInvoiceable
	}
	orderById := make(map[int]SubscriptionOrder, len(orders))
	for _, order := range orders {
		orderById[order.Id] = order
	}
	ordered := make([]SubscriptionOrder, 0, len(ids))
	for _, id := range ids {
		order, ok := orderById[id]
		if !ok {
			return nil, ErrInvoiceSubscriptionOrderNotInvoiceable
		}
		ordered = append(ordered, order)
	}
	return ordered, nil
}

func isInvoiceUniqueConflict(err error) bool {
	message := strings.ToLower(err.Error())
	return strings.Contains(message, "unique") || strings.Contains(message, "duplicate")
}

func ListUserInvoiceRequests(userID int, status string, offset int, limit int) ([]InvoiceRequest, int64, error) {
	query := DB.Model(&InvoiceRequest{}).Where("user_id = ?", userID)
	if strings.TrimSpace(status) != "" {
		query = query.Where("status = ?", strings.TrimSpace(status))
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []InvoiceRequest
	if err := query.Order("id desc").Limit(limit).Offset(offset).Preload("Items").Preload("SubscriptionItems").Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func ListAdminInvoiceRequests(status string, keyword string, offset int, limit int) ([]InvoiceRequest, int64, error) {
	query := DB.Model(&InvoiceRequest{})
	if strings.TrimSpace(status) != "" {
		query = query.Where("status = ?", strings.TrimSpace(status))
	}
	if strings.TrimSpace(keyword) != "" {
		like := "%" + strings.TrimSpace(keyword) + "%"
		itemSubQuery := DB.Model(&InvoiceRequestItem{}).Select("invoice_request_id").Where("trade_no LIKE ?", like)
		subscriptionItemSubQuery := DB.Model(&InvoiceRequestSubscriptionItem{}).Select("invoice_request_id").Where("trade_no LIKE ?", like)
		query = query.Where("username LIKE ? OR title LIKE ? OR tax_no LIKE ? OR id IN (?) OR id IN (?)", like, like, like, itemSubQuery, subscriptionItemSubQuery)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []InvoiceRequest
	if err := query.Order("id desc").Limit(limit).Offset(offset).Preload("Items").Preload("SubscriptionItems").Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func GetInvoiceRequestWithItems(id int, userID int, admin bool) (*InvoiceRequest, error) {
	var request InvoiceRequest
	query := DB.Preload("Items").Preload("SubscriptionItems").Where("id = ?", id)
	if !admin {
		query = query.Where("user_id = ?", userID)
	}
	if err := query.First(&request).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvoiceNotFound
		}
		return nil, err
	}
	return &request, nil
}

func CancelInvoiceRequest(id int, userID int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		var request InvoiceRequest
		if err := tx.Where("id = ? AND user_id = ?", id, userID).First(&request).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInvoiceNotFound
			}
			return err
		}
		if request.Status != InvoiceStatusPending {
			return ErrInvoiceStatusTransition
		}
		return tx.Model(&request).Updates(map[string]interface{}{"status": InvoiceStatusCancelled}).Error
	})
}

func ApproveInvoiceRequest(id int, operatorID int) error {
	return updateInvoiceStatus(id, InvoiceStatusPending, map[string]interface{}{
		"status":      InvoiceStatusApproved,
		"reviewed_by": operatorID,
		"reviewed_at": common.GetTimestamp(),
	})
}

func RejectInvoiceRequest(id int, operatorID int, reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return ErrInvoiceRejectReasonRequired
	}
	return updateInvoiceStatus(id, InvoiceStatusPending, map[string]interface{}{
		"status":        InvoiceStatusRejected,
		"reject_reason": reason,
		"reviewed_by":   operatorID,
		"reviewed_at":   common.GetTimestamp(),
	})
}

func IssueInvoiceRequest(id int, operatorID int, input InvoiceIssueInput) error {
	if strings.TrimSpace(input.InvoiceNo) == "" {
		return ErrInvoiceNumberRequired
	}
	issuedAt := input.IssuedAt
	if issuedAt == 0 {
		issuedAt = common.GetTimestamp()
	}
	return updateInvoiceStatus(id, InvoiceStatusApproved, map[string]interface{}{
		"status":      InvoiceStatusIssued,
		"invoice_no":  strings.TrimSpace(input.InvoiceNo),
		"invoice_url": strings.TrimSpace(input.InvoiceUrl),
		"issued_at":   issuedAt,
		"issue_note":  strings.TrimSpace(input.IssueNote),
		"reviewed_by": operatorID,
		"reviewed_at": common.GetTimestamp(),
	})
}

func updateInvoiceStatus(id int, fromStatus string, values map[string]interface{}) error {
	result := DB.Model(&InvoiceRequest{}).Where("id = ? AND status = ?", id, fromStatus).Updates(values)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		var count int64
		if err := DB.Model(&InvoiceRequest{}).Where("id = ?", id).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return ErrInvoiceNotFound
		}
		return ErrInvoiceStatusTransition
	}
	return nil
}
