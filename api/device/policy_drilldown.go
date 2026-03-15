package device

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ──────────────────────────────────────────────────────────────────────────────
// Policy Drill-Down: Full definition with deep UUID resolution
// ──────────────────────────────────────────────────────────────────────────────

// DrillDownSequence is a fully resolved, human-readable policy sequence.
type DrillDownSequence struct {
	Index        int               `json:"index"`
	SequenceName string            `json:"sequenceName"`
	SequenceType string            `json:"sequenceType"`
	SequenceIP   string            `json:"sequenceIpType,omitempty"`
	BaseAction   string            `json:"baseAction"`
	Match        []MatchEntry      `json:"match"`
	Actions      []ActionEntry     `json:"actions"`
	Summary      string            `json:"summary"`
}

// MatchEntry is a single resolved match condition.
type MatchEntry struct {
	Field    string `json:"field"`
	Label    string `json:"label"`
	Value    string `json:"value"`
	RawRef   string `json:"rawRef,omitempty"`
	ListName string `json:"listName,omitempty"`
}

// ActionEntry is a single resolved action parameter.
type ActionEntry struct {
	Field    string `json:"field"`
	Label    string `json:"label"`
	Value    string `json:"value"`
	RawRef   string `json:"rawRef,omitempty"`
	ListName string `json:"listName,omitempty"`
}

// DrillDownResponse is the full policy definition response.
type DrillDownResponse struct {
	DefinitionID   string              `json:"definitionId"`
	Name           string              `json:"name"`
	Type           string              `json:"type"`
	Description    string              `json:"description"`
	DefaultAction  string              `json:"defaultAction"`
	SequenceCount  int                 `json:"sequenceCount"`
	Sequences      []DrillDownSequence `json:"sequences"`
}

// Friendly labels for match and action fields
var drillDownFieldLabels = map[string]string{
	"sourceDataPrefixList":      "Source Prefix",
	"destinationDataPrefixList": "Dest Prefix",
	"sourcePrefixList":          "Source Prefix",
	"destinationPrefixList":     "Dest Prefix",
	"sourceIp":                  "Source IP",
	"destinationIp":             "Dest IP",
	"sourcePort":                "Source Port",
	"destinationPort":           "Dest Port",
	"protocol":                  "Protocol",
	"protocolName":              "Protocol",
	"dscp":                      "DSCP",
	"app":                       "Application",
	"appList":                   "App List",
	"dnsAppList":                "DNS App List",
	"dns":                       "DNS",
	"packetLength":              "Packet Length",
	"plp":                       "PLP",
	"trafficTo":                 "Traffic To",
	"localTlocColor":            "Local TLOC Color",
	"preferredColorGroup":       "Preferred Color Group",
	"colorList":                 "Color List",
	"policer":                   "Policer",
	"carrier":                   "Carrier",
	"domainId":                  "Domain ID",
	"groupId":                   "Group ID",
	"tlocList":                  "TLOC List",
	"tloc":                      "TLOC",
	"vpnList":                   "VPN List",
	"vpn":                       "VPN",
	"siteList":                  "Site List",
	"prefixList":                "Prefix List",
	"serviceArea":               "Service Area",
	"slaClass":                  "SLA Class",
	"community":                 "Community",
	"communityList":             "Community List",
	"ompTag":                    "OMP Tag",
	"origin":                    "Origin",
	"originator":                "Originator",
	"preference":                "Preference",
	"affinityGroupPreference":   "Affinity Group Pref",
	"set":                       "Set",
	"nat":                       "NAT",
	"redirect":                  "Redirect DNS",
	"log":                       "Log",
	"count":                     "Counter",
	"cflowd":                    "Cflowd",
	"tcpOptimization":           "TCP Optimization",
	"lossCorrection":            "FEC",
	"lossProtect":               "Loss Protection",
	"sig":                       "SIG Redirect",
	"fallbackToRouting":         "Fallback to Routing",
	"exportTo":                  "Export To",
}

func fieldLabel(field string) string {
	if label, ok := drillDownFieldLabels[field]; ok {
		return label
	}
	// camelCase → Title Case
	result := ""
	for i, ch := range field {
		if i > 0 && ch >= 'A' && ch <= 'Z' {
			result += " "
		}
		if i == 0 {
			result += strings.ToUpper(string(ch))
		} else {
			result += string(ch)
		}
	}
	return result
}

// FetchPolicyDefinition returns a fully resolved policy definition.
// GET /api/policy/definition/{type}/{id}
func FetchPolicyDefinition(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defType := mux.Vars(r)["type"]
		defID := mux.Vars(r)["id"]
		if defType == "" || defID == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'type' or 'id' path parameter")
			return
		}

		log.Printf("📖 Policy drill-down: type=%s, id=%s", defType, defID)

		// Fetch the raw definition from vManage
		endpoint := fmt.Sprintf("dataservice/template/policy/definition/%s/%s", defType, defID)
		rawDef, err := apiClient.Get(endpoint)
		if err != nil {
			log.Printf("Policy definition fetch error for %s/%s: %v", defType, defID, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR",
				fmt.Sprintf("Failed to fetch policy definition %s/%s", defType, defID))
			return
		}

		// Parse the top-level definition
		var defBody struct {
			Name          string            `json:"name"`
			Type          string            `json:"type"`
			Description   string            `json:"description"`
			DefaultAction json.RawMessage   `json:"defaultAction"`
			DefinitionID  string            `json:"definitionId"`
			Sequences     []json.RawMessage `json:"sequences"`
		}
		if err := json.Unmarshal(rawDef, &defBody); err != nil {
			log.Printf("Policy definition parse error: %v", err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse policy definition")
			return
		}

		// Parse defaultAction — can be a string or an object like {"type":"drop"}
		defaultAction := "accept"
		if defBody.DefaultAction != nil {
			var daStr string
			if err := json.Unmarshal(defBody.DefaultAction, &daStr); err == nil {
				defaultAction = daStr
			} else {
				var daObj struct {
					Type string `json:"type"`
				}
				if err := json.Unmarshal(defBody.DefaultAction, &daObj); err == nil && daObj.Type != "" {
					defaultAction = daObj.Type
				}
			}
		}

		// Build the list resolver for deep UUID resolution
		resolver := buildPolicyListResolver(apiClient)

		// Parse and resolve each sequence
		sequences := make([]DrillDownSequence, 0, len(defBody.Sequences))
		for idx, rawSeq := range defBody.Sequences {
			seq := parseAndResolveSequence(rawSeq, idx, resolver)
			sequences = append(sequences, seq)
		}

		resp := DrillDownResponse{
			DefinitionID:  defID,
			Name:          defBody.Name,
			Type:          defBody.Type,
			Description:   defBody.Description,
			DefaultAction: defaultAction,
			SequenceCount: len(sequences),
			Sequences:     sequences,
		}

		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}

// parseAndResolveSequence parses a single raw sequence and resolves all UUID references.
func parseAndResolveSequence(rawSeq json.RawMessage, index int, resolver map[string]policyListInfo) DrillDownSequence {
	var s struct {
		SequenceName   string `json:"sequenceName"`
		SequenceType   string `json:"sequenceType"`
		SequenceIPType string `json:"sequenceIpType"`
		BaseAction     string `json:"baseAction"`
		Match          struct {
			Entries []struct {
				Field string `json:"field"`
				Ref   string `json:"ref"`
				Value string `json:"value"`
			} `json:"entries"`
		} `json:"match"`
		Actions []struct {
			Type      string `json:"type"`
			Parameter []struct {
				Field string `json:"field"`
				Ref   string `json:"ref"`
				Value string `json:"value"`
			} `json:"parameter"`
		} `json:"actions"`
	}
	json.Unmarshal(rawSeq, &s)

	// Resolve match entries
	matchEntries := make([]MatchEntry, 0)
	for _, e := range s.Match.Entries {
		if e.Field == "" {
			continue
		}
		rawVal := e.Value
		if rawVal == "" {
			rawVal = e.Ref
		}
		resolvedVal := rawVal
		listName := ""
		if rawVal != "" && uuidRe.MatchString(rawVal) {
			if info, ok := resolver[rawVal]; ok {
				listName = info.Name
				if len(info.Entries) > 0 {
					resolvedVal = fmt.Sprintf("%s [%s]", info.Name, strings.Join(info.Entries, ", "))
				} else {
					resolvedVal = info.Name
				}
			}
		}
		matchEntries = append(matchEntries, MatchEntry{
			Field:    e.Field,
			Label:    fieldLabel(e.Field),
			Value:    resolvedVal,
			RawRef:   rawVal,
			ListName: listName,
		})
	}

	// Resolve action entries
	actionEntries := make([]ActionEntry, 0)
	for _, a := range s.Actions {
		if a.Type != "" && a.Type != s.BaseAction {
			actionEntries = append(actionEntries, ActionEntry{
				Field: "type",
				Label: "Action Type",
				Value: a.Type,
			})
		}
		for _, p := range a.Parameter {
			if p.Field == "" {
				continue
			}
			rawVal := p.Value
			if rawVal == "" {
				rawVal = p.Ref
			}
			resolvedVal := rawVal
			listName := ""
			if rawVal != "" && uuidRe.MatchString(rawVal) {
				if info, ok := resolver[rawVal]; ok {
					listName = info.Name
					if len(info.Entries) > 0 {
						resolvedVal = fmt.Sprintf("%s [%s]", info.Name, strings.Join(info.Entries, ", "))
					} else {
						resolvedVal = info.Name
					}
				}
			}
			actionEntries = append(actionEntries, ActionEntry{
				Field:    p.Field,
				Label:    fieldLabel(p.Field),
				Value:    resolvedVal,
				RawRef:   rawVal,
				ListName: listName,
			})
		}
	}

	// Generate human-readable summary line
	summary := buildSequenceSummary(s.SequenceName, index, s.BaseAction, matchEntries, actionEntries)

	return DrillDownSequence{
		Index:        index + 1,
		SequenceName: s.SequenceName,
		SequenceType: s.SequenceType,
		SequenceIP:   s.SequenceIPType,
		BaseAction:   s.BaseAction,
		Match:        matchEntries,
		Actions:      actionEntries,
		Summary:      summary,
	}
}

// buildSequenceSummary generates a one-line human-readable summary.
// Example: "Seq 10: Match Source SITE_A & Dest DNS_SERVERS → Action: Redirect to VPN 10 (NAT)"
func buildSequenceSummary(name string, index int, baseAction string, matches []MatchEntry, actions []ActionEntry) string {
	seqLabel := name
	if seqLabel == "" {
		seqLabel = fmt.Sprintf("Sequence %d", index+1)
	}

	// Build match part
	matchParts := make([]string, 0)
	for _, m := range matches {
		display := m.Value
		if m.ListName != "" {
			display = m.ListName
		}
		matchParts = append(matchParts, fmt.Sprintf("%s %s", m.Label, display))
	}
	matchStr := "all traffic"
	if len(matchParts) > 0 {
		matchStr = strings.Join(matchParts, " & ")
	}

	// Build action part
	actionParts := make([]string, 0)
	for _, a := range actions {
		if a.Field == "type" {
			continue
		}
		display := a.Value
		if a.ListName != "" {
			display = a.ListName
		}
		switch a.Field {
		case "set":
			actionParts = append(actionParts, fmt.Sprintf("Set %s", display))
		case "nat":
			actionParts = append(actionParts, fmt.Sprintf("NAT %s", display))
		case "redirect":
			actionParts = append(actionParts, fmt.Sprintf("Redirect DNS %s", display))
		case "count":
			actionParts = append(actionParts, fmt.Sprintf("Count %s", display))
		case "log":
			actionParts = append(actionParts, "Log")
		default:
			actionParts = append(actionParts, fmt.Sprintf("%s %s", a.Label, display))
		}
	}

	action := strings.Title(baseAction)
	if len(actionParts) > 0 {
		action = fmt.Sprintf("%s (%s)", strings.Title(baseAction), strings.Join(actionParts, ", "))
	}

	return fmt.Sprintf("%s: Match %s → Action: %s", seqLabel, matchStr, action)
}
