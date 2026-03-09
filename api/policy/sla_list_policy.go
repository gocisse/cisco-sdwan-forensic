package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// PolicySlaDefinition represents an SLA policy definition in vManage.
type PolicySlaDefinition struct {
	ListID      string `json:"listId"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Entries     []struct {
		Jitter  string `json:"jitter"`
		Latency string `json:"latency"`
		Loss    string `json:"loss"`
	} `json:"entries"`
	LastUpdated         int64  `json:"lastUpdated"`
	Owner               string `json:"owner"`
	ReadOnly            bool   `json:"readOnly"`
	Version             string `json:"version"`
	InfoTag             string `json:"infoTag"`
	ReferenceCount      int    `json:"referenceCount"`
	References          []any  `json:"references"`
	IsActivatedByVsmart bool   `json:"isActivatedByVsmart"`
}

// FetchPolicySla retrieves and returns SLA policy definitions.
func FetchPolicySla(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := apiClient.Get("dataservice/template/policy/list/sla")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var response struct {
			Data []PolicySlaDefinition `json:"data"`
		}

		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
