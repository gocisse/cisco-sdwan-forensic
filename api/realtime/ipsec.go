package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// IpSec represents the filtered IPSEC statistics data.
type IpSec struct {
	DestIP               string `json:"dest-ip"`
	SourcePort           int    `json:"source-port"`
	VdeviceName          string `json:"vdevice-name"`
	IpsecRxFailures      int    `json:"ipsec-rx-failures"`
	IpsecRxAuthFailures  int    `json:"ipsec-rx-auth-failures"`
	IpsecTxAuthFailures  int    `json:"ipsec-tx-auth-failures"`
	VdeviceHostName      string `json:"vdevice-host-name"`
	TunnelProtocol       string `json:"tunnel-protocol"`
	DestPort             int    `json:"dest-port"`
	VdeviceDataKey       string `json:"vdevice-dataKey"`
	IpsecDecryptInbound  int    `json:"ipsec-decrypt-inbound"`
	Lastupdated          int64  `json:"lastupdated"`
	SourceIP             string `json:"source-ip"`
	IpsecTxFailures      int    `json:"ipsec-tx-failures"`
	IpsecEncryptOutbound int    `json:"ipsec-encrypt-outbound"`
}

// FetchIpsecStatistics retrieves and filters IPSEC statistics for a device
func FetchIpsecStatistics(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/tunnel/ipsec_statistics?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []IpSec `json:"data"`
		}

		// Parse raw JSON response into IpSec struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
