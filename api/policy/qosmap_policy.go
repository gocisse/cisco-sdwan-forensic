package policy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// QosMapList represents an entry from /dataservice/template/policy/definition/qosmap
type QosMapList struct {
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

// FetchQosMapPolicies retrieves and returns QOS map definitions from vManage.
func FetchQosMapPolicies(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1) Fetch data from the vManage QoS map endpoint
		data, err := apiClient.Get("dataservice/template/policy/definition/qosmap")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 2) Unmarshal into a wrapper struct that has the "data" field
		var response struct {
			Data []QosMapList `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse QoS map response", http.StatusInternalServerError)
			return
		}

		// 3) Return the array of QosMapList
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
