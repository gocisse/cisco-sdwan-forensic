package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// IpPrefixList represents an IP Prefix List policy in vManage.
type IpPrefixList struct {
	ListID      string `json:"listId"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Entries     []struct {
		IPPrefix string `json:"ipPrefix"`
	} `json:"entries"`
	LastUpdated    int64  `json:"lastUpdated"`
	Owner          string `json:"owner"`
	ReadOnly       bool   `json:"readOnly"`
	Version        string `json:"version"`
	InfoTag        string `json:"infoTag"`
	ReferenceCount int    `json:"referenceCount"`
	References     []struct {
		ID   string `json:"id"`
		Type string `json:"type"`
	} `json:"references"`
	ActivatedID         []string `json:"activatedId"`
	IsActivatedByVsmart bool     `json:"isActivatedByVsmart"`
}

// FetchPrefixListPolicies retrieves and returns IP Prefix List policies.
func FetchPrefixListPolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := apiClient.Get("dataservice/template/policy/list/prefix")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var response struct {
			Data []IpPrefixList `json:"data"`
		}

		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
