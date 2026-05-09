package model

import (
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	VerifyTypePersonal = "personal"
	VerifyTypeCompany  = "company"

	RealNameStatusUnverified = "unverified"
	RealNameStatusPending    = "pending"
	RealNameStatusVerified   = "verified"
	RealNameStatusFailed     = "failed"
	RealNameStatusExpired    = "expired"
)

var (
	ErrRealNameVerifyTypeInvalid       = errors.New("real-name verification type must be personal or company")
	ErrRealNameProviderRequired        = errors.New("real-name provider is required")
	ErrRealNameProviderRequestRequired = errors.New("real-name provider request id is required")
	ErrRealNameStatusInvalid           = errors.New("real-name verification status is invalid")
	ErrRealNameVerificationNotFound    = errors.New("real-name verification not found")
)

type UserRealNameVerification struct {
	Id                    int    `json:"id"`
	UserId                int    `json:"user_id" gorm:"index;not null"`
	VerifyType            string `json:"verify_type" gorm:"type:varchar(16);not null;index"`
	Provider              string `json:"provider" gorm:"type:varchar(32);not null;index;uniqueIndex:idx_realname_provider_request"`
	ProviderRequestId     string `json:"provider_request_id" gorm:"type:varchar(128);not null;uniqueIndex:idx_realname_provider_request"`
	Status                string `json:"status" gorm:"type:varchar(16);not null;index"`
	VerifiedName          string `json:"verified_name" gorm:"type:varchar(255);not null;default:''"`
	CompanyName           string `json:"company_name" gorm:"type:varchar(255);not null;default:''"`
	IdNoMasked            string `json:"id_no_masked" gorm:"type:varchar(64);not null;default:''"`
	IdNoHash              string `json:"-" gorm:"type:varchar(128);not null;default:''"`
	CreditCode            string `json:"credit_code" gorm:"type:varchar(64);not null;default:''"`
	CreditCodeHash        string `json:"-" gorm:"type:varchar(128);not null;default:''"`
	LegalPersonNameMasked string `json:"legal_person_name_masked" gorm:"type:varchar(255);not null;default:''"`
	ProviderResultCode    string `json:"provider_result_code" gorm:"type:varchar(64);not null;default:''"`
	ProviderResultMessage string `json:"provider_result_message" gorm:"type:varchar(255);not null;default:''"`
	RawPayloadEncrypted   string `json:"-" gorm:"type:text;not null;default:''"`
	StartedAt             int64  `json:"started_at" gorm:"bigint;not null;default:0"`
	VerifiedAt            int64  `json:"verified_at" gorm:"bigint;not null;default:0"`
	ExpiredAt             int64  `json:"expired_at" gorm:"bigint;not null;default:0"`
	CreatedAt             int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt             int64  `json:"updated_at" gorm:"bigint"`
}

func (v *UserRealNameVerification) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	v.CreatedAt = now
	v.UpdatedAt = now
	if v.StartedAt == 0 {
		v.StartedAt = now
	}
	if v.Status == "" {
		v.Status = RealNameStatusPending
	}
	return nil
}

func (v *UserRealNameVerification) BeforeUpdate(tx *gorm.DB) error {
	v.UpdatedAt = common.GetTimestamp()
	return nil
}

type InvoiceProfiles struct {
	Personal *UserInvoiceProfile `json:"personal"`
	Company  *UserInvoiceProfile `json:"company"`
}

type RealNameVerificationResultInput struct {
	Provider              string
	ProviderRequestId     string
	Status                string
	VerifiedName          string
	CompanyName           string
	IdNo                  string
	CreditCode            string
	LegalPersonName       string
	ProviderResultCode    string
	ProviderResultMessage string
	RawPayloadEncrypted   string
}

func IsValidVerifyType(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return value == VerifyTypePersonal || value == VerifyTypeCompany
}

func IsValidRealNameResultStatus(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	switch value {
	case RealNameStatusUnverified,
		RealNameStatusPending,
		RealNameStatusVerified,
		RealNameStatusFailed,
		RealNameStatusExpired:
		return true
	default:
		return false
	}
}

func MaskSensitiveIdentifier(value string) string {
	value = strings.TrimSpace(value)
	runes := []rune(value)
	if len(runes) <= 4 {
		return "****"
	}
	if len(runes) <= 9 {
		return string(runes[:2]) + "****" + string(runes[len(runes)-2:])
	}
	return string(runes[:3]) + strings.Repeat("*", len(runes)-7) + string(runes[len(runes)-4:])
}

func CreateRealNameVerificationSession(userID int, verifyType string, provider string, providerRequestID string) (*UserRealNameVerification, error) {
	verifyType = strings.ToLower(strings.TrimSpace(verifyType))
	provider = strings.TrimSpace(provider)
	providerRequestID = strings.TrimSpace(providerRequestID)
	if !IsValidVerifyType(verifyType) {
		return nil, ErrRealNameVerifyTypeInvalid
	}
	if provider == "" {
		return nil, ErrRealNameProviderRequired
	}
	if providerRequestID == "" {
		return nil, ErrRealNameProviderRequestRequired
	}
	verification := UserRealNameVerification{
		UserId:            userID,
		VerifyType:        verifyType,
		Provider:          provider,
		ProviderRequestId: providerRequestID,
		Status:            RealNameStatusPending,
		StartedAt:         common.GetTimestamp(),
	}
	if err := DB.Create(&verification).Error; err != nil {
		return nil, err
	}
	return &verification, nil
}

func GetRealNameVerificationByProviderRequest(provider string, providerRequestID string) (*UserRealNameVerification, error) {
	var verification UserRealNameVerification
	err := DB.Where("provider = ? AND provider_request_id = ?", provider, providerRequestID).First(&verification).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrRealNameVerificationNotFound
	}
	if err != nil {
		return nil, err
	}
	return &verification, nil
}

func GetUserRealNameStatus(userID int) (map[string]*UserRealNameVerification, error) {
	var rows []UserRealNameVerification
	if err := DB.Where("user_id = ?", userID).Order("id desc").Find(&rows).Error; err != nil {
		return nil, err
	}
	result := map[string]*UserRealNameVerification{
		VerifyTypePersonal: nil,
		VerifyTypeCompany:  nil,
	}
	for i := range rows {
		row := rows[i]
		if result[row.VerifyType] == nil {
			result[row.VerifyType] = &row
		}
	}
	return result, nil
}

func GetUserInvoiceProfiles(userID int) (InvoiceProfiles, error) {
	var rows []UserInvoiceProfile
	if err := DB.Where("user_id = ?", userID).Find(&rows).Error; err != nil {
		return InvoiceProfiles{}, err
	}
	var profiles InvoiceProfiles
	for i := range rows {
		row := rows[i]
		switch row.InvoiceType {
		case InvoiceTypePersonal:
			profiles.Personal = &row
		case InvoiceTypeCompany:
			profiles.Company = &row
		}
	}
	return profiles, nil
}

func UpsertManualInvoiceProfile(profile UserInvoiceProfile) (*UserInvoiceProfile, error) {
	profile.InvoiceType = NormalizeInvoiceType(profile.InvoiceType)
	if !IsValidInvoiceType(profile.InvoiceType) {
		return nil, ErrInvoiceTypeInvalid
	}
	profile.Source = InvoiceProfileSourceManual
	profile.IsDefault = true

	var existing UserInvoiceProfile
	err := DB.Where("user_id = ? AND invoice_type = ?", profile.UserId, profile.InvoiceType).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := DB.Create(&profile).Error; err != nil {
			return nil, err
		}
		return &profile, nil
	}
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"source":                    InvoiceProfileSourceManual,
		"real_name_verification_id": nil,
		"title":                     strings.TrimSpace(profile.Title),
		"tax_no":                    strings.TrimSpace(profile.TaxNo),
		"email":                     strings.TrimSpace(profile.Email),
		"phone":                     strings.TrimSpace(profile.Phone),
		"bank_name":                 strings.TrimSpace(profile.BankName),
		"bank_account":              strings.TrimSpace(profile.BankAccount),
		"registered_address":        strings.TrimSpace(profile.RegisteredAddress),
		"registered_phone":          strings.TrimSpace(profile.RegisteredPhone),
		"is_default":                true,
	}
	if err := DB.Model(&existing).Updates(updates).Error; err != nil {
		return nil, err
	}
	return GetInvoiceProfile(profile.UserId, profile.InvoiceType)
}

func GetInvoiceProfile(userID int, invoiceType string) (*UserInvoiceProfile, error) {
	var profile UserInvoiceProfile
	err := DB.Where("user_id = ? AND invoice_type = ?", userID, NormalizeInvoiceType(invoiceType)).First(&profile).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func ApplyRealNameVerificationResult(input RealNameVerificationResultInput) error {
	input.Provider = strings.TrimSpace(input.Provider)
	input.ProviderRequestId = strings.TrimSpace(input.ProviderRequestId)
	input.Status = strings.ToLower(strings.TrimSpace(input.Status))
	if input.Provider == "" {
		return ErrRealNameProviderRequired
	}
	if input.ProviderRequestId == "" {
		return ErrRealNameProviderRequestRequired
	}
	if !IsValidRealNameResultStatus(input.Status) {
		return ErrRealNameStatusInvalid
	}

	return DB.Transaction(func(tx *gorm.DB) error {
		updates := map[string]interface{}{
			"status":                  input.Status,
			"provider_result_code":    strings.TrimSpace(input.ProviderResultCode),
			"provider_result_message": strings.TrimSpace(input.ProviderResultMessage),
			"raw_payload_encrypted":   strings.TrimSpace(input.RawPayloadEncrypted),
		}
		if input.Status == RealNameStatusVerified {
			updates["verified_at"] = common.GetTimestamp()
			updates["verified_name"] = strings.TrimSpace(input.VerifiedName)
			updates["company_name"] = strings.TrimSpace(input.CompanyName)
			if strings.TrimSpace(input.IdNo) != "" {
				updates["id_no_masked"] = MaskSensitiveIdentifier(input.IdNo)
				updates["id_no_hash"] = common.GenerateHMAC(input.IdNo)
			}
			if strings.TrimSpace(input.CreditCode) != "" {
				updates["credit_code"] = strings.TrimSpace(input.CreditCode)
				updates["credit_code_hash"] = common.GenerateHMAC(input.CreditCode)
			}
			if strings.TrimSpace(input.LegalPersonName) != "" {
				updates["legal_person_name_masked"] = MaskSensitiveIdentifier(input.LegalPersonName)
			}
		}
		result := tx.Model(&UserRealNameVerification{}).
			Where("provider = ? AND provider_request_id = ? AND status IN ?", input.Provider, input.ProviderRequestId, []string{RealNameStatusUnverified, RealNameStatusPending}).
			Updates(updates)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			var verification UserRealNameVerification
			err := tx.Where("provider = ? AND provider_request_id = ?", input.Provider, input.ProviderRequestId).First(&verification).Error
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrRealNameVerificationNotFound
			}
			if err != nil {
				return err
			}
			return nil
		}
		if input.Status != RealNameStatusVerified {
			return nil
		}

		var profile UserInvoiceProfile
		profileType := InvoiceTypePersonal
		title := strings.TrimSpace(input.VerifiedName)
		taxNo := ""
		var verification UserRealNameVerification
		if err := tx.Where("provider = ? AND provider_request_id = ?", input.Provider, input.ProviderRequestId).First(&verification).Error; err != nil {
			return err
		}
		if verification.VerifyType == VerifyTypeCompany {
			profileType = InvoiceTypeCompany
			title = strings.TrimSpace(input.CompanyName)
			taxNo = strings.TrimSpace(input.CreditCode)
		}
		verificationID := verification.Id
		err := tx.Where("user_id = ? AND invoice_type = ?", verification.UserId, profileType).First(&profile).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			profile = UserInvoiceProfile{
				UserId:                 verification.UserId,
				InvoiceType:            profileType,
				Source:                 InvoiceProfileSourceVerified,
				RealNameVerificationId: &verificationID,
				Title:                  title,
				TaxNo:                  taxNo,
				IsDefault:              true,
			}
			return tx.Create(&profile).Error
		}
		if err != nil {
			return err
		}
		return tx.Model(&profile).Updates(map[string]interface{}{
			"source":                    InvoiceProfileSourceVerified,
			"real_name_verification_id": verificationID,
			"title":                     title,
			"tax_no":                    taxNo,
			"is_default":                true,
		}).Error
	})
}
