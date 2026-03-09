package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// SlaClassList represents an SLA Class policy entry from /dataservice/template/policy/list/class
type SlaClassList struct {
	ListID      string `json:"listId"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Entries     []struct {
		Queue string `json:"queue"`
	} `json:"entries"`
	LastUpdated         int64  `json:"lastUpdated"`
	Owner               string `json:"owner"`
	ReadOnly            bool   `json:"readOnly"`
	Version             string `json:"version"`
	InfoTag             string `json:"infoTag"`
	ReferenceCount      int    `json:"referenceCount"`
	References          []struct {
		ID   string `json:"id"`
		Type string `json:"type"`
	} `json:"references"`
	ActivatedID         []string `json:"activatedId"`
	IsActivatedByVsmart bool     `json:"isActivatedByVsmart"`
}

// FetchSlaClassListPolicies retrieves and returns SLA Class lists from vManage.
func FetchSlaClassListPolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1) Request data from the vManage endpoint
		data, err := apiClient.Get("dataservice/template/policy/list/class")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 2) Unmarshal into a wrapper struct containing a "data" array
		var response struct {
			Data []SlaClassList `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse SLA Class list response", http.StatusInternalServerError)
			return
		}

		// 3) Return the array in JSON format
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
