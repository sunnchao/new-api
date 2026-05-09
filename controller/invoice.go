package controller

import (
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type createInvoiceRequest struct {
	TopUpIds    []int  `json:"topup_ids"`
	InvoiceType string `json:"invoice_type"`
	Title       string `json:"title"`
	TaxNo       string `json:"tax_no"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Remark      string `json:"remark"`
}

type invoiceProfileRequest struct {
	InvoiceType       string `json:"invoice_type"`
	Title             string `json:"title"`
	TaxNo             string `json:"tax_no"`
	Email             string `json:"email"`
	Phone             string `json:"phone"`
	BankName          string `json:"bank_name"`
	BankAccount       string `json:"bank_account"`
	RegisteredAddress string `json:"registered_address"`
	RegisteredPhone   string `json:"registered_phone"`
}

type rejectInvoiceRequest struct {
	RejectReason string `json:"reject_reason"`
}

type adminIssueInvoiceRequest struct {
	InvoiceNo  string `json:"invoice_no"`
	InvoiceUrl string `json:"invoice_url"`
	IssuedAt   int64  `json:"issued_at"`
	IssueNote  string `json:"issue_note"`
}

func GetEligibleInvoiceTopUps(c *gin.Context) {
	userID := c.GetInt("id")
	pageInfo := common.GetPageQuery(c)
	items, total, err := model.ListEligibleInvoiceTopUps(userID, c.Query("keyword"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}

func ListSelfInvoices(c *gin.Context) {
	userID := c.GetInt("id")
	pageInfo := common.GetPageQuery(c)
	items, total, err := model.ListUserInvoiceRequests(userID, c.Query("status"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}

func GetInvoiceDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	request, err := model.GetInvoiceRequestWithItems(id, c.GetInt("id"), false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, request)
}

func CreateInvoice(c *gin.Context) {
	var req createInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	request, err := model.CreateInvoiceRequest(model.InvoiceCreateInput{
		UserId:      c.GetInt("id"),
		Username:    c.GetString("username"),
		TopUpIds:    req.TopUpIds,
		InvoiceType: req.InvoiceType,
		Title:       req.Title,
		TaxNo:       req.TaxNo,
		Email:       req.Email,
		Phone:       req.Phone,
		Remark:      req.Remark,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, request)
}

func CancelInvoice(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.CancelInvoiceRequest(id, c.GetInt("id")); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func GetInvoiceProfiles(c *gin.Context) {
	profiles, err := model.GetUserInvoiceProfiles(c.GetInt("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, profiles)
}

func UpdateInvoiceProfile(c *gin.Context) {
	var req invoiceProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	profile, err := model.UpsertManualInvoiceProfile(model.UserInvoiceProfile{
		UserId:            c.GetInt("id"),
		InvoiceType:       req.InvoiceType,
		Title:             strings.TrimSpace(req.Title),
		TaxNo:             strings.TrimSpace(req.TaxNo),
		Email:             strings.TrimSpace(req.Email),
		Phone:             strings.TrimSpace(req.Phone),
		BankName:          strings.TrimSpace(req.BankName),
		BankAccount:       strings.TrimSpace(req.BankAccount),
		RegisteredAddress: strings.TrimSpace(req.RegisteredAddress),
		RegisteredPhone:   strings.TrimSpace(req.RegisteredPhone),
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, profile)
}

func AdminListInvoices(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	items, total, err := model.ListAdminInvoiceRequests(c.Query("status"), c.Query("keyword"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}

func AdminGetInvoiceDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	request, err := model.GetInvoiceRequestWithItems(id, 0, true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, request)
}

func AdminApproveInvoice(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.ApproveInvoiceRequest(id, c.GetInt("id")); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func AdminRejectInvoice(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	var req rejectInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.RejectInvoiceRequest(id, c.GetInt("id"), req.RejectReason); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func AdminIssueInvoice(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	var req adminIssueInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.IssueInvoiceRequest(id, c.GetInt("id"), model.InvoiceIssueInput{
		InvoiceNo:  req.InvoiceNo,
		InvoiceUrl: req.InvoiceUrl,
		IssuedAt:   req.IssuedAt,
		IssueNote:  req.IssueNote,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
