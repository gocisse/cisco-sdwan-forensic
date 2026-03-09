package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// ColorList represents a color list policy in vManage.
type ColorList struct {
	ListID      string `json:"listId"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Entries     []struct {
		Color string `json:"color"`
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

// FetchColorListPolicies retrieves and returns Color List policies.
func FetchColorListPolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1) Hit vManage endpoint for color lists
		data, err := apiClient.Get("dataservice/template/policy/list/color")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 2) Unmarshal the response into our wrapper struct
		var response struct {
			Data []ColorList `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse Color List response", http.StatusInternalServerError)
			return
		}

		// 3) Return the array of color lists in JSON format
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
