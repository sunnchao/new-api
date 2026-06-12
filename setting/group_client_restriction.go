package setting

import (
	"fmt"
	"strings"
	"sync"

	"github.com/QuantumNous/new-api/common"
)

const (
	GroupClientRestrictionsOptionKey = "GroupClientRestrictions"

	ClientClaudeCode = "claude_code"
	ClientCodex      = "codex"
)

var (
	groupClientRestrictions      = map[string][]string{}
	groupClientRestrictionsMutex sync.RWMutex
)

var allowedGroupRestrictionClients = map[string]struct{}{
	ClientClaudeCode: {},
	ClientCodex:      {},
}

// Group client restrictions map group names to the client IDs allowed to use them.
// Missing groups and empty client lists are treated as unrestricted.
func GroupClientRestrictions2JSONString() string {
	groupClientRestrictionsMutex.RLock()
	defer groupClientRestrictionsMutex.RUnlock()

	jsonBytes, err := common.Marshal(groupClientRestrictions)
	if err != nil {
		common.SysLog("error marshalling group client restrictions: " + err.Error())
		return "{}"
	}
	return string(jsonBytes)
}

func CheckGroupClientRestrictions(jsonStr string) error {
	_, err := parseGroupClientRestrictions(jsonStr)
	return err
}

func UpdateGroupClientRestrictionsByJSONString(jsonStr string) error {
	parsed, err := parseGroupClientRestrictions(jsonStr)
	if err != nil {
		return err
	}

	groupClientRestrictionsMutex.Lock()
	defer groupClientRestrictionsMutex.Unlock()
	groupClientRestrictions = parsed
	return nil
}

func GetGroupAllowedClients(group string) []string {
	groupClientRestrictionsMutex.RLock()
	defer groupClientRestrictionsMutex.RUnlock()

	clients := groupClientRestrictions[group]
	if len(clients) == 0 {
		return nil
	}
	copyClients := make([]string, len(clients))
	copy(copyClients, clients)
	return copyClients
}

func parseGroupClientRestrictions(jsonStr string) (map[string][]string, error) {
	jsonStr = strings.TrimSpace(jsonStr)
	if jsonStr == "" || jsonStr == "null" {
		return map[string][]string{}, nil
	}

	parsed := make(map[string][]string)
	if err := common.UnmarshalJsonStr(jsonStr, &parsed); err != nil {
		return nil, err
	}

	normalized := make(map[string][]string, len(parsed))
	for group, clients := range parsed {
		group = strings.TrimSpace(group)
		if group == "" {
			return nil, fmt.Errorf("group name must not be empty")
		}

		seen := make(map[string]struct{}, len(clients))
		for _, client := range clients {
			client = strings.ToLower(strings.TrimSpace(client))
			if client == "" {
				return nil, fmt.Errorf("client id for group %s must not be empty", group)
			}
			if _, ok := allowedGroupRestrictionClients[client]; !ok {
				return nil, fmt.Errorf("unsupported client %s for group %s", client, group)
			}
			if _, ok := seen[client]; ok {
				continue
			}
			seen[client] = struct{}{}
			normalized[group] = append(normalized[group], client)
		}
	}

	return normalized, nil
}
