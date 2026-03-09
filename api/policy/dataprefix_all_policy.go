package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// DataListAll represents the structure returned by /dataservice/template/policy/list/dataprefixall
type DataListAll struct {
	ListID      string `json:"listId"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Entries     []struct {
		IPPrefix string `json:"ipPrefix"`
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

// FetchDataListAllPolicies handles retrieving Data Prefix All policies from vManage.
func FetchDataListAllPolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1) Request data from vManage
		data, err := apiClient.Get("dataservice/template/policy/list/dataprefixall")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 2) Unmarshal into a wrapper struct that has the "data" field
		var response struct {
			Data []DataListAll `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse Data Prefix All response", http.StatusInternalServerError)
			return
		}

		// 3) Return the array in JSON format
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
