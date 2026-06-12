package setting

import "testing"

func TestCheckGroupClientRestrictionsAcceptsKnownClients(t *testing.T) {
	jsonStr := `{"claude-only":["claude_code"],"codex-only":["codex"],"agent-only":["claude_code","codex"]}`

	if err := CheckGroupClientRestrictions(jsonStr); err != nil {
		t.Fatalf("expected valid restriction JSON, got %v", err)
	}
}

func TestCheckGroupClientRestrictionsRejectsUnknownClient(t *testing.T) {
	jsonStr := `{"restricted":["cursor"]}`

	if err := CheckGroupClientRestrictions(jsonStr); err == nil {
		t.Fatal("expected unknown client to be rejected")
	}
}

func TestUpdateGroupClientRestrictionsStoresCopy(t *testing.T) {
	original := GroupClientRestrictions2JSONString()
	t.Cleanup(func() {
		if err := UpdateGroupClientRestrictionsByJSONString(original); err != nil {
			t.Fatalf("restore group client restrictions: %v", err)
		}
	})

	if err := UpdateGroupClientRestrictionsByJSONString(`{"agent":["claude_code","codex"]}`); err != nil {
		t.Fatalf("update group client restrictions: %v", err)
	}

	clients := GetGroupAllowedClients("agent")
	if len(clients) != 2 || clients[0] != "claude_code" || clients[1] != "codex" {
		t.Fatalf("unexpected clients: %#v", clients)
	}

	clients[0] = "mutated"
	clients = GetGroupAllowedClients("agent")
	if clients[0] != "claude_code" {
		t.Fatalf("expected stored clients to be immutable copy, got %#v", clients)
	}
}
