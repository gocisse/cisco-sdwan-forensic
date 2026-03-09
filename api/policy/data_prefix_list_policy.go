package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// PrefixList represents a prefix list policy in vManage.
type PrefixList struct {
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
	IsActivatedByVsmart bool `json:"isActivatedByVsmart"`
}

// FetchDataPrefix retrieves and returns prefix list policies.
func FetchDataPrefix(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := apiClient.Get("dataservice/template/policy/list/dataprefix")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var response struct {
			Data []PrefixList `json:"data"`
		}

		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
