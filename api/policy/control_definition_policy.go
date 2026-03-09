package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// ControlPolicyDefinition represents a control policy definition in vManage.
type ControlPolicyDefinition struct {
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

// FetchControlPolicies retrieves and returns control policy definitions.
func FetchControlPolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := apiClient.Get("dataservice/template/policy/definition/control")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var response struct {
			Data []ControlPolicyDefinition `json:"data"`
		}

		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
