// vsmart_policy.go
package edgepolicy

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"
)

// VsmartPolicy corresponds to /dataservice/template/policy/vsmart
type VsmartPolicy struct {
	PolicyVersion     string `json:"policyVersion"`
	LastUpdatedBy     string `json:"lastUpdatedBy"`
	PolicyName        string `json:"policyName"`
	PolicyDefinition  string `json:"policyDefinition"`
	CreatedOn         int64  `json:"createdOn"`
	IsPolicyActivated bool   `json:"isPolicyActivated"`
	PolicyDescription string `json:"policyDescription"`
	Rid               int    `json:"@rid"`
	PolicyID          string `json:"policyId"`
	CreatedBy         string `json:"createdBy"`
	PolicyType        string `json:"policyType"`
	LastUpdatedOn     int64  `json:"lastUpdatedOn"`
}

// FetchVsmartPolicy fetches data from /dataservice/template/policy/vsmart
func FetchVsmartPolicy(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		endpoint := "dataservice/template/policy/vsmart"

		data, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch vSmart policies from vManage")
			return
		}

		var resp struct {
			Data []VsmartPolicy `json:"data"`
		}
		if err := json.Unmarshal(data, &resp); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse vSmart policy response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, resp.Data)
	}
}
