package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// BFD represents the filtered BFD session data.
type BFD struct {
	DestIP          string `json:"dest-ip"`
	SourcePort      int    `json:"source-port"`
	BfdEchoRxPkts   int    `json:"bfd-echo-rx-pkts"`
	VdeviceName     string `json:"vdevice-name"`
	BfdPmtuTxOctets int    `json:"bfd-pmtu-tx-octets"`
	BfdEchoTxOctets int    `json:"bfd-echo-tx-octets"`
	BfdPmtuRxOctets int    `json:"bfd-pmtu-rx-octets"`
	VdeviceHostName string `json:"vdevice-host-name"`
	TunnelProtocol  string `json:"tunnel-protocol"`
	BfdPmtuTxPkts   int    `json:"bfd-pmtu-tx-pkts"`
	DestPort        int    `json:"dest-port"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	Lastupdated     int64  `json:"lastupdated"`
	SourceIP        string `json:"source-ip"`
	BfdEchoTxPkts   int    `json:"bfd-echo-tx-pkts"`
	BfdPmtuRxPkts   int    `json:"bfd-pmtu-rx-pkts"`
	BfdEchoRxOctets int    `json:"bfd-echo-rx-octets"`
}

// FetchBfdSessions retrieves and filters BFD sessions for a device
func FetchBfdSessions(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/tunnel/bfd_statistics?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []BFD `json:"data"`
		}

		// Parse raw JSON response into BFD struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
