package device

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ──────────────────────────────────────────────────────────────────────────────
// Local Policy Structs
// ──────────────────────────────────────────────────────────────────────────────

// LocalPolicyEntry represents a single policy item running on a device.
type LocalPolicyEntry struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	Direction    string `json:"direction,omitempty"`
	Interface    string `json:"interface,omitempty"`
	Sequence     string `json:"sequence,omitempty"`
	CIR          string `json:"cir,omitempty"`
	Burst        string `json:"burst,omitempty"`
	ExceedAction string `json:"exceedAction,omitempty"`
}

// LocalPolicyResponse is the consolidated response for GET /api/device/{system-ip}/policy/local.
type LocalPolicyResponse struct {
	SystemIP     string             `json:"systemIp"`
	HostName     string             `json:"hostName"`
	SiteID       string             `json:"siteId"`
	AccessLists  []LocalPolicyEntry `json:"accessLists"`
	QosMaps      []LocalPolicyEntry `json:"qosMaps"`
	Policers     []LocalPolicyEntry `json:"policers"`
	ZoneFirewall []LocalPolicyEntry `json:"zoneFirewall"`
	TotalCount   int                `json:"totalCount"`
}

// ──────────────────────────────────────────────────────────────────────────────
// Centralized Policy Structs
// ──────────────────────────────────────────────────────────────────────────────

// CentralPolicyMatch represents a centralized policy that affects a device.
type CentralPolicyMatch struct {
	PolicyName string               `json:"policyName"`
	PolicyID   string               `json:"policyId"`
	PolicyType string               `json:"policyType"`
	IsActive   bool                 `json:"isActive"`
	Sequences  []PolicySequenceInfo `json:"sequences,omitempty"`
}

// PolicySequenceInfo holds simplified sequence match/action info.
type PolicySequenceInfo struct {
	SequenceName string `json:"sequenceName"`
	SequenceType string `json:"sequenceType"`
	BaseAction   string `json:"baseAction"`
}

// CentralPolicyResponse is the consolidated response for GET /api/device/{system-ip}/policy/centralized.
type CentralPolicyResponse struct {
	SystemIP        string               `json:"systemIp"`
	HostName        string               `json:"hostName"`
	SiteID          string               `json:"siteId"`
	DataPolicies    []CentralPolicyMatch `json:"dataPolicies"`
	ControlPolicies []CentralPolicyMatch `json:"controlPolicies"`
	AppPolicies     []CentralPolicyMatch `json:"appRoutePolicies"`
	TotalCount      int                  `json:"totalCount"`
}

// ──────────────────────────────────────────────────────────────────────────────
// Handler: Local Policy
// ──────────────────────────────────────────────────────────────────────────────

// FetchLocalPolicy returns the effective local policies on a device.
// GET /api/device/{system-ip}/policy/local
//
// Calls:
//   - /dataservice/device/policy/accesslistnames?deviceId={system-ip}
//   - /dataservice/device/policy/qosmapinfo?deviceId={system-ip}
//   - /dataservice/device/policer?deviceId={system-ip}
//   - /dataservice/device/policy/zonebfwdp/sessions?deviceId={system-ip}
func FetchLocalPolicy(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		// Look up device for hostname / site-id context
		dev, err := findDevice(apiClient, systemIP)
		if err != nil {
			log.Printf("Device lookup error: %v", err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to look up device")
			return
		}
		if dev == nil {
			middleware.WriteError(w, http.StatusNotFound, "NOT_FOUND",
				fmt.Sprintf("No device found with system-ip %s", systemIP))
			return
		}

		// Fetch ACLs
		acls := fetchLocalPolicyItems(apiClient, systemIP, "dataservice/device/policy/accesslistnames",
			func(raw json.RawMessage) []LocalPolicyEntry {
				var items []struct {
					Name      string `json:"aclName"`
					Direction string `json:"aclDirection"`
					Interface string `json:"ifName"`
				}
				json.Unmarshal(raw, &items)
				entries := make([]LocalPolicyEntry, 0, len(items))
				for _, it := range items {
					entries = append(entries, LocalPolicyEntry{
						Name:      it.Name,
						Type:      "access-list",
						Direction: it.Direction,
						Interface: it.Interface,
					})
				}
				return entries
			})

		// Fetch QoS maps
		qos := fetchLocalPolicyItems(apiClient, systemIP, "dataservice/device/policy/qosmapinfo",
			func(raw json.RawMessage) []LocalPolicyEntry {
				var items []struct {
					Name      string `json:"qosMapName"`
					Interface string `json:"ifName"`
					Direction string `json:"qosMapDirection"`
				}
				json.Unmarshal(raw, &items)
				entries := make([]LocalPolicyEntry, 0, len(items))
				for _, it := range items {
					entries = append(entries, LocalPolicyEntry{
						Name:      it.Name,
						Type:      "qos-map",
						Direction: it.Direction,
						Interface: it.Interface,
					})
				}
				return entries
			})

		// Fetch policers
		policers := fetchLocalPolicyItems(apiClient, systemIP, "dataservice/device/policer",
			func(raw json.RawMessage) []LocalPolicyEntry {
				log.Printf("\U0001f50d Raw policer data for %s: %s", systemIP, string(raw))
				var items []struct {
					Name      string      `json:"name"`
					Rate      json.Number `json:"rate"`
					Burst     json.Number `json:"burst"`
					OosAction string      `json:"oos-action"`
					Direction string      `json:"direction"`
				}
				json.Unmarshal(raw, &items)
				entries := make([]LocalPolicyEntry, 0, len(items))
				for _, it := range items {
					if it.Name == "" {
						continue
					}
					entries = append(entries, LocalPolicyEntry{
						Name:         it.Name,
						Type:         "policer",
						CIR:          it.Rate.String(),
						Burst:        it.Burst.String(),
						ExceedAction: it.OosAction,
						Direction:    it.Direction,
					})
				}
				return entries
			})

		// Fetch zone-based firewall sessions (may not exist on all devices)
		zbfw := fetchLocalPolicyItems(apiClient, systemIP, "dataservice/device/policy/zonebfwdp/sessions",
			func(raw json.RawMessage) []LocalPolicyEntry {
				var items []struct {
					SrcZone string `json:"src-zone"`
					DstZone string `json:"dst-zone"`
					Policy  string `json:"policy-name"`
				}
				json.Unmarshal(raw, &items)
				// Deduplicate by policy name
				seen := make(map[string]bool)
				entries := make([]LocalPolicyEntry, 0)
				for _, it := range items {
					key := it.Policy + "|" + it.SrcZone + "->" + it.DstZone
					if seen[key] {
						continue
					}
					seen[key] = true
					entries = append(entries, LocalPolicyEntry{
						Name: fmt.Sprintf("%s (%s → %s)", it.Policy, it.SrcZone, it.DstZone),
						Type: "zone-firewall",
					})
				}
				return entries
			})

		total := len(acls) + len(qos) + len(policers) + len(zbfw)

		resp := LocalPolicyResponse{
			SystemIP:     dev.SystemIP,
			HostName:     dev.HostName,
			SiteID:       dev.SiteID,
			AccessLists:  acls,
			QosMaps:      qos,
			Policers:     policers,
			ZoneFirewall: zbfw,
			TotalCount:   total,
		}

		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}

// fetchLocalPolicyItems is a helper that fetches a device-scoped endpoint and
// maps the raw JSON data array into LocalPolicyEntry items using a mapper function.
func fetchLocalPolicyItems(
	apiClient *utils.APIClient,
	systemIP string,
	endpoint string,
	mapper func(json.RawMessage) []LocalPolicyEntry,
) []LocalPolicyEntry {
	rawData, err := apiClient.Get(fmt.Sprintf("%s?deviceId=%s", endpoint, systemIP))
	if err != nil {
		log.Printf("Local policy fetch warning (%s): %v", endpoint, err)
		return []LocalPolicyEntry{}
	}

	var envelope struct {
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(rawData, &envelope); err != nil || envelope.Data == nil {
		return []LocalPolicyEntry{}
	}

	return mapper(envelope.Data)
}

// ──────────────────────────────────────────────────────────────────────────────
// Handler: Centralized Policy
// ──────────────────────────────────────────────────────────────────────────────

// FetchCentralizedPolicy returns the vSmart centralized policies affecting a device.
// GET /api/device/{system-ip}/policy/centralized
//
// Flow:
//  1. Look up the device to get its site-id.
//  2. Call /dataservice/template/policy/vsmart to get all active vSmart policies.
//  3. For each policy, fetch its definition to check if any site lists contain this device's site-id.
//  4. Return matching data, control, and app-route policies.
func FetchCentralizedPolicy(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		// Step 1: Find device → get site-id
		dev, err := findDevice(apiClient, systemIP)
		if err != nil {
			log.Printf("Device lookup error: %v", err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to look up device")
			return
		}
		if dev == nil {
			middleware.WriteError(w, http.StatusNotFound, "NOT_FOUND",
				fmt.Sprintf("No device found with system-ip %s", systemIP))
			return
		}

		siteID := dev.SiteID
		log.Printf("\U0001f50d Centralized policy lookup for device %s, site-id=%s", systemIP, siteID)

		// Step 2: Fetch all vSmart policies
		rawPolicies, err := apiClient.Get("dataservice/template/policy/vsmart")
		if err != nil {
			log.Printf("vSmart policy fetch error: %v", err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch vSmart policies")
			return
		}

		var policyEnvelope struct {
			Data []struct {
				PolicyID          string `json:"policyId"`
				PolicyName        string `json:"policyName"`
				PolicyType        string `json:"policyType"`
				IsPolicyActivated bool   `json:"isPolicyActivated"`
				PolicyDefinition  string `json:"policyDefinition"`
			} `json:"data"`
		}
		if err := json.Unmarshal(rawPolicies, &policyEnvelope); err != nil {
			log.Printf("vSmart policy parse error: %v", err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse vSmart policies")
			return
		}
		log.Printf("\U0001f50d Found %d vSmart policies", len(policyEnvelope.Data))

		// Step 3: For each active policy, check if the device's site-id is covered
		var dataPolicies, controlPolicies, appPolicies []CentralPolicyMatch

		for _, pol := range policyEnvelope.Data {
			// Parse the embedded policyDefinition JSON string
			// vManage returns siteLists as a plain string array ["uuid1", "uuid2"]
			var def struct {
				Assemblies []struct {
					Type         string `json:"type"`
					DefinitionID string `json:"definitionId"`
					Entries      []struct {
						SiteLists []string `json:"siteLists"`
						Direction string   `json:"direction"`
					} `json:"entries"`
				} `json:"assembly"`
			}

			if err := json.Unmarshal([]byte(pol.PolicyDefinition), &def); err != nil {
				log.Printf("Policy definition parse error for %s: %v (raw: %.500s)", pol.PolicyName, err, pol.PolicyDefinition)
				continue
			}
			log.Printf("\U0001f50d Policy %q: %d assemblies, active=%v", pol.PolicyName, len(def.Assemblies), pol.IsPolicyActivated)

			// Collect all site list refs from this policy
			siteListRefs := make(map[string]bool)
			for _, asm := range def.Assemblies {
				for _, entry := range asm.Entries {
					for _, sl := range entry.SiteLists {
						siteListRefs[sl] = true
					}
				}
			}

			// Check if any of the referenced site lists contain our device's site-id
			log.Printf("\U0001f50d Policy %q has %d site list refs", pol.PolicyName, len(siteListRefs))
			matchesSite := false
			for ref := range siteListRefs {
				if siteListContainsSiteID(apiClient, ref, siteID) {
					log.Printf("\u2705 Site list %s contains site-id %s for policy %q", ref, siteID, pol.PolicyName)
					matchesSite = true
					break
				}
			}

			if !matchesSite {
				log.Printf("\u274c Policy %q does not match site-id %s", pol.PolicyName, siteID)
				continue
			}

			// Build sequences info from the assemblies
			for _, asm := range def.Assemblies {
				match := CentralPolicyMatch{
					PolicyName: pol.PolicyName,
					PolicyID:   pol.PolicyID,
					PolicyType: asm.Type,
					IsActive:   pol.IsPolicyActivated,
				}

				// Try to get definition sequences for richer info
				match.Sequences = fetchDefinitionSequences(apiClient, asm.DefinitionID, asm.Type)

				switch asm.Type {
				case "data":
					dataPolicies = append(dataPolicies, match)
				case "control":
					controlPolicies = append(controlPolicies, match)
				case "appRoute":
					appPolicies = append(appPolicies, match)
				default:
					dataPolicies = append(dataPolicies, match)
				}
			}
		}

		if dataPolicies == nil {
			dataPolicies = []CentralPolicyMatch{}
		}
		if controlPolicies == nil {
			controlPolicies = []CentralPolicyMatch{}
		}
		if appPolicies == nil {
			appPolicies = []CentralPolicyMatch{}
		}

		total := len(dataPolicies) + len(controlPolicies) + len(appPolicies)

		resp := CentralPolicyResponse{
			SystemIP:        dev.SystemIP,
			HostName:        dev.HostName,
			SiteID:          dev.SiteID,
			DataPolicies:    dataPolicies,
			ControlPolicies: controlPolicies,
			AppPolicies:     appPolicies,
			TotalCount:      total,
		}

		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}

// siteListContainsSiteID fetches a site list by its ID and checks if it contains the given siteID.
func siteListContainsSiteID(apiClient *utils.APIClient, siteListRef, siteID string) bool {
	rawData, err := apiClient.Get(fmt.Sprintf("dataservice/template/policy/list/site/%s", siteListRef))
	if err != nil {
		log.Printf("Site list fetch warning for ref %s: %v", siteListRef, err)
		return false
	}

	log.Printf("🔍 Site list %s raw response: %.500s", siteListRef, string(rawData))

	var siteList struct {
		Entries []struct {
			SiteID string `json:"siteId"`
		} `json:"entries"`
	}
	if err := json.Unmarshal(rawData, &siteList); err != nil {
		log.Printf("Site list parse error for %s: %v", siteListRef, err)
		return false
	}

	log.Printf("🔍 Site list %s has %d entries, looking for site-id %s", siteListRef, len(siteList.Entries), siteID)
	for _, entry := range siteList.Entries {
		// Site list entries can contain ranges like "100-200" or single IDs like "100"
		if matchesSiteEntry(entry.SiteID, siteID) {
			return true
		}
	}
	return false
}

// matchesSiteEntry checks if a siteID matches a site list entry.
// Entries can be single values ("100") or ranges ("100-200").
func matchesSiteEntry(entry, siteID string) bool {
	entry = strings.TrimSpace(entry)
	siteID = strings.TrimSpace(siteID)
	if entry == siteID {
		return true
	}
	// Check for range format using numeric comparison
	parts := strings.SplitN(entry, "-", 2)
	if len(parts) == 2 {
		lo, errLo := strconv.Atoi(parts[0])
		hi, errHi := strconv.Atoi(parts[1])
		site, errSite := strconv.Atoi(siteID)
		if errLo == nil && errHi == nil && errSite == nil {
			return site >= lo && site <= hi
		}
	}
	return false
}

// fetchDefinitionSequences fetches a policy definition and extracts sequence names/actions.
func fetchDefinitionSequences(apiClient *utils.APIClient, definitionID, defType string) []PolicySequenceInfo {
	if definitionID == "" {
		return nil
	}

	endpoint := fmt.Sprintf("dataservice/template/policy/definition/%s/%s", defType, definitionID)
	rawDef, err := apiClient.Get(endpoint)
	if err != nil {
		log.Printf("Definition fetch warning for %s/%s: %v", defType, definitionID, err)
		return nil
	}

	var defBody struct {
		Sequences []struct {
			SequenceName string `json:"sequenceName"`
			SequenceType string `json:"sequenceType"`
			BaseAction   string `json:"baseAction"`
		} `json:"sequences"`
	}
	if err := json.Unmarshal(rawDef, &defBody); err != nil {
		return nil
	}

	seqs := make([]PolicySequenceInfo, 0, len(defBody.Sequences))
	for _, s := range defBody.Sequences {
		seqs = append(seqs, PolicySequenceInfo{
			SequenceName: s.SequenceName,
			SequenceType: s.SequenceType,
			BaseAction:   s.BaseAction,
		})
	}
	return seqs
}
