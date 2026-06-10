package controller

import (
	"net/http"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/require"
)

func TestSearchUserTicketsFiltersByStatus(t *testing.T) {
	setupTicketNotifyTestDB(t)

	userId := 6101
	require.NoError(t, model.DB.Create(&model.Ticket{
		Id:          7101,
		UserId:      userId,
		Title:       "Smoke billing question",
		Category:    "billing",
		Priority:    model.TicketPriorityMedium,
		Status:      model.TicketStatusPending,
		Description: "Smoke search pending ticket",
	}).Error)
	require.NoError(t, model.DB.Create(&model.Ticket{
		Id:          7102,
		UserId:      userId,
		Title:       "Smoke technical issue",
		Category:    "technical",
		Priority:    model.TicketPriorityHigh,
		Status:      model.TicketStatusReplied,
		Description: "Smoke search replied ticket",
	}).Error)

	ctx, recorder := newAuthenticatedContext(
		t,
		http.MethodGet,
		"/api/ticket/self/search?keyword=Smoke&status=1&p=1&page_size=10",
		nil,
		userId,
	)

	SearchUserTickets(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var page struct {
		Total int            `json:"total"`
		Items []model.Ticket `json:"items"`
	}
	require.NoError(t, common.Unmarshal(response.Data, &page))
	require.Equal(t, 1, page.Total)
	require.Len(t, page.Items, 1)
	require.Equal(t, 7101, page.Items[0].Id)
	require.Equal(t, model.TicketStatusPending, page.Items[0].Status)
}
