package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// AppRoutePolicy represents an application-aware routing policy in vManage.
type AppRoutePolicy struct {
	Name           string `json:"name"`
	DefinitionID   string `json:"definitionId"`
	Type           string `json:"type"`
	Description    string `json:"description"`
	Owner          string `json:"owner"`
	LastUpdated    int64  `json:"lastUpdated"`
	InfoTag        string `json:"infoTag"`
	ReferenceCount int    `json:"referenceCount"`
	References     []any  `json:"references"`
}

// FetchAppRoutePolicies retrieves and returns AppRoute policy definitions.
func FetchAppRoutePolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := apiClient.Get("dataservice/template/policy/definition/approute")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var response struct {
			Data []AppRoutePolicy `json:"data"`
		}

		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
