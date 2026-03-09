package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// DataList represents an entry from /dataservice/template/policy/definition/data
type DataList struct {
	Name           string `json:"name"`
	DefinitionID   string `json:"definitionId"`
	Type           string `json:"type"`
	Description    string `json:"description"`
	Owner          string `json:"owner"`
	LastUpdated    int64  `json:"lastUpdated"`
	InfoTag        string `json:"infoTag"`
	Mode           string `json:"mode"`
	Optimized      string `json:"optimized"`
	ReferenceCount int    `json:"referenceCount"`
	References     []any  `json:"references"`
}

// FetchDataDefinitionPolicies retrieves and returns Data Definition policies from vManage.
func FetchDataDefinitionPolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1) Request data from the vManage endpoint
		data, err := apiClient.Get("dataservice/template/policy/definition/data")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 2) Unmarshal into a temporary struct that has the "data" field
		var response struct {
			Data []DataList `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse Data Definition policy response", http.StatusInternalServerError)
			return
		}

		// 3) Return the array in JSON format
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
