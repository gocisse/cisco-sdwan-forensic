package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// TlocList represents TLOC list data from /dataservice/template/policy/list/tloc
type TlocList struct {
	ListID      string `json:"listId"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Entries     []struct {
		Tloc       string `json:"tloc"`
		Color      string `json:"color"`
		Encap      string `json:"encap"`
		Preference string `json:"preference"`
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
	IsActivatedByVsmart bool   `json:"isActivatedByVsmart"`
}

// FetchTlocListPolicies retrieves and returns TLOC lists from vManage.
func FetchTlocListPolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1) Fetch data from vManage
		data, err := apiClient.Get("dataservice/template/policy/list/tloc")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 2) Unmarshal the "data" array into our TlocList slice
		var response struct {
			Data []TlocList `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse TLOC list response", http.StatusInternalServerError)
			return
		}

		// 3) Return JSON array of TlocList
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
