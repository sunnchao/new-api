package model

import (
	"fmt"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupRealNameModelTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	LOG_DB = db

	require.NoError(t, db.AutoMigrate(&UserRealNameVerification{}, &UserInvoiceProfile{}))
	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func TestRealNameDomainAutoMigrateSQLite(t *testing.T) {
	db := setupRealNameModelTestDB(t)

	require.True(t, db.Migrator().HasTable(&UserRealNameVerification{}))
	require.True(t, db.Migrator().HasIndex(&UserRealNameVerification{}, "idx_realname_provider_request"))
	require.True(t, db.Migrator().HasColumn(&UserRealNameVerification{}, "id_no_hash"))
	require.True(t, db.Migrator().HasColumn(&UserRealNameVerification{}, "raw_payload_encrypted"))
}

func TestMaskSensitiveIdentifier(t *testing.T) {
	require.Equal(t, "110***********1234", MaskSensitiveIdentifier("110101199001011234"))
	require.Equal(t, "AB****YZ", MaskSensitiveIdentifier("ABCDEFGYZ"))
	require.Equal(t, "张三****王五", MaskSensitiveIdentifier("张三李四王五"))
	require.Equal(t, "****", MaskSensitiveIdentifier("1234"))
}

func TestRealNameStatusValidatorAcceptsDeclaredStatuses(t *testing.T) {
	for _, status := range []string{
		RealNameStatusUnverified,
		RealNameStatusPending,
		RealNameStatusVerified,
		RealNameStatusFailed,
		RealNameStatusExpired,
	} {
		require.True(t, IsValidRealNameResultStatus(status))
	}
	require.False(t, IsValidRealNameResultStatus("unknown"))
}

func TestCreateRealNameSessionRequiresProviderAndRequestID(t *testing.T) {
	setupRealNameModelTestDB(t)

	_, err := CreateRealNameVerificationSession(7, VerifyTypePersonal, "", "mock-req-1")
	require.ErrorIs(t, err, ErrRealNameProviderRequired)

	_, err = CreateRealNameVerificationSession(7, VerifyTypePersonal, "mock", "")
	require.ErrorIs(t, err, ErrRealNameProviderRequestRequired)

	err = ApplyRealNameVerificationResult(RealNameVerificationResultInput{
		ProviderRequestId: "mock-req-1",
		Status:            RealNameStatusVerified,
	})
	require.ErrorIs(t, err, ErrRealNameProviderRequired)

	err = ApplyRealNameVerificationResult(RealNameVerificationResultInput{
		Provider: "mock",
		Status:   RealNameStatusVerified,
	})
	require.ErrorIs(t, err, ErrRealNameProviderRequestRequired)
}

func TestCreateRealNameSessionAndApplyVerifiedPersonalProfile(t *testing.T) {
	setupRealNameModelTestDB(t)

	verification, err := CreateRealNameVerificationSession(7, VerifyTypePersonal, "mock", "mock-req-1")
	require.NoError(t, err)
	require.Equal(t, RealNameStatusPending, verification.Status)

	err = ApplyRealNameVerificationResult(RealNameVerificationResultInput{
		Provider:              "mock",
		ProviderRequestId:     "mock-req-1",
		Status:                RealNameStatusVerified,
		VerifiedName:          "Alice",
		IdNo:                  "110101199001011234",
		ProviderResultCode:    "OK",
		ProviderResultMessage: "verified",
		SafeAuditPayload:      "safe-audit-payload",
	})
	require.NoError(t, err)

	updated, err := GetRealNameVerificationByProviderRequest("mock", "mock-req-1")
	require.NoError(t, err)
	require.Equal(t, RealNameStatusVerified, updated.Status)
	require.Equal(t, "110***********1234", updated.IdNoMasked)
	require.NotEmpty(t, updated.IdNoHash)

	profiles, err := GetUserInvoiceProfiles(7)
	require.NoError(t, err)
	require.NotNil(t, profiles.Personal)
	require.Equal(t, "Alice", profiles.Personal.Title)
	require.Equal(t, InvoiceProfileSourceVerified, profiles.Personal.Source)
}

func TestApplyVerifiedCompanyProfile(t *testing.T) {
	setupRealNameModelTestDB(t)

	verification, err := CreateRealNameVerificationSession(7, VerifyTypeCompany, "mock", "mock-company-1")
	require.NoError(t, err)
	require.Equal(t, VerifyTypeCompany, verification.VerifyType)

	err = ApplyRealNameVerificationResult(RealNameVerificationResultInput{
		Provider:              "mock",
		ProviderRequestId:     "mock-company-1",
		Status:                RealNameStatusVerified,
		CompanyName:           "Example Ltd",
		CreditCode:            "91310000MA1K00000X",
		LegalPersonName:       "Bob",
		ProviderResultCode:    "OK",
		ProviderResultMessage: "verified",
	})
	require.NoError(t, err)

	profiles, err := GetUserInvoiceProfiles(7)
	require.NoError(t, err)
	require.NotNil(t, profiles.Company)
	require.Equal(t, "Example Ltd", profiles.Company.Title)
	require.Equal(t, "91310000MA1K00000X", profiles.Company.TaxNo)
}

func TestApplyRealNameVerificationResultIgnoresLateDowngrade(t *testing.T) {
	setupRealNameModelTestDB(t)

	verification, err := CreateRealNameVerificationSession(7, VerifyTypePersonal, "mock", "mock-req-2")
	require.NoError(t, err)

	err = ApplyRealNameVerificationResult(RealNameVerificationResultInput{
		Provider:              "mock",
		ProviderRequestId:     "mock-req-2",
		Status:                RealNameStatusVerified,
		VerifiedName:          "Alice",
		IdNo:                  "110101199001011234",
		ProviderResultCode:    "OK",
		ProviderResultMessage: "verified",
		SafeAuditPayload:      "safe-audit-payload",
	})
	require.NoError(t, err)

	err = ApplyRealNameVerificationResult(RealNameVerificationResultInput{
		Provider:              "mock",
		ProviderRequestId:     "mock-req-2",
		Status:                RealNameStatusFailed,
		ProviderResultCode:    "ERR",
		ProviderResultMessage: "late callback",
		SafeAuditPayload:      "late-safe-audit-payload",
	})
	require.NoError(t, err)

	updated, err := GetRealNameVerificationByProviderRequest(verification.Provider, verification.ProviderRequestId)
	require.NoError(t, err)
	require.Equal(t, RealNameStatusVerified, updated.Status)

	profiles, err := GetUserInvoiceProfiles(7)
	require.NoError(t, err)
	require.NotNil(t, profiles.Personal)
	require.Equal(t, "Alice", profiles.Personal.Title)
	require.Equal(t, InvoiceProfileSourceVerified, profiles.Personal.Source)
}
