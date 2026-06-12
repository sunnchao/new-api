package service

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
)

func newGroupClientRestrictionTestContext(headers map[string]string) *gin.Context {
	req := httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = req
	return ctx
}

func TestRequestMatchesClientDetectsCodexHeaders(t *testing.T) {
	ctx := newGroupClientRestrictionTestContext(map[string]string{
		"User-Agent":            "codex_cli_rs/0.36.0",
		"OpenAI-Beta":           "responses=v1",
		"OpenAI-Originator":     "codex_cli_rs",
		"OpenAI-Organization":   "org_123",
		"OpenAI-Project":        "proj_123",
		"OpenAI-Client-User-ID": "user_123",
	})

	if !RequestMatchesClient(ctx, setting.ClientCodex) {
		t.Fatal("expected Codex client headers to match codex")
	}
	if RequestMatchesClient(ctx, setting.ClientClaudeCode) {
		t.Fatal("did not expect Codex headers to match claude_code")
	}
}

func TestRequestMatchesClientDetectsClaudeCodeHeaders(t *testing.T) {
	ctx := newGroupClientRestrictionTestContext(map[string]string{
		"User-Agent": "claude-cli/1.0.64",
		"X-App":      "cli",
	})

	if !RequestMatchesClient(ctx, setting.ClientClaudeCode) {
		t.Fatal("expected Claude Code CLI headers to match claude_code")
	}
	if RequestMatchesClient(ctx, setting.ClientCodex) {
		t.Fatal("did not expect Claude Code headers to match codex")
	}
}

func TestFilterGroupsByClientRestrictionRemovesDisallowedGroups(t *testing.T) {
	original := setting.GroupClientRestrictions2JSONString()
	t.Cleanup(func() {
		if err := setting.UpdateGroupClientRestrictionsByJSONString(original); err != nil {
			t.Fatalf("restore group client restrictions: %v", err)
		}
	})
	if err := setting.UpdateGroupClientRestrictionsByJSONString(`{"claude-only":["claude_code"],"codex-only":["codex"],"open":[]}`); err != nil {
		t.Fatalf("update group client restrictions: %v", err)
	}
	ctx := newGroupClientRestrictionTestContext(map[string]string{
		"User-Agent":        "codex_vscode/0.1.0",
		"OpenAI-Originator": "codex_vscode",
	})

	groups := FilterGroupsByClientRestriction(ctx, []string{"claude-only", "codex-only", "open", "missing"})

	want := []string{"codex-only", "open", "missing"}
	if len(groups) != len(want) {
		t.Fatalf("unexpected filtered groups: got %#v want %#v", groups, want)
	}
	for i := range want {
		if groups[i] != want[i] {
			t.Fatalf("unexpected filtered groups: got %#v want %#v", groups, want)
		}
	}
}

func TestIsRequestAllowedForGroupAllowsUnrestrictedGroups(t *testing.T) {
	original := setting.GroupClientRestrictions2JSONString()
	t.Cleanup(func() {
		if err := setting.UpdateGroupClientRestrictionsByJSONString(original); err != nil {
			t.Fatalf("restore group client restrictions: %v", err)
		}
	})
	if err := setting.UpdateGroupClientRestrictionsByJSONString(`{"restricted":["codex"]}`); err != nil {
		t.Fatalf("update group client restrictions: %v", err)
	}
	ctx := newGroupClientRestrictionTestContext(nil)

	if !IsRequestAllowedForGroup(ctx, "unrestricted") {
		t.Fatal("expected groups without restrictions to be allowed")
	}
	if IsRequestAllowedForGroup(ctx, "restricted") {
		t.Fatal("expected restricted group to reject unmatched request")
	}
}
