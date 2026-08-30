package device

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ─── Cellular Connection ────────────────────────────────────────────────────
// Primary connection status - fetch first to determine if cellular is active

type CellularConnection struct {
	Interface      string `json:"if-name"`
	IPAddress      string `json:"ip-address"`
	IPv6Address    string `json:"ipv6-address"`
	Profile        string `json:"profile"`
	PrimaryDNS     string `json:"primary-dns"`
	SecondaryDNS   string `json:"secondary-dns"`
	RxPackets      int64  `json:"rx-packets"`
	TxPackets      int64  `json:"tx-packets"`
	RxBytes        int64  `json:"rx-bytes"`
	TxBytes        int64  `json:"tx-bytes"`
	PacketState    string `json:"pkt-session-status"`
	SessionState   string `json:"session-state"`
	RadioMode      string `json:"radio-mode"`
	SignalStrength string `json:"signal-strength"`
	RSSI           int    `json:"rssi"`
	RSRP           int    `json:"rsrp"`
	RSRQ           int    `json:"rsrq"`
	SNR            int    `json:"snr"`
	Band           string `json:"band"`
	Channel        int    `json:"channel"`
}

// ─── EIOLTE Session ─────────────────────────────────────────────────────────
// Detailed session/operational state

type CellularSession struct {
	Interface    string `json:"if-name"`
	AttachState  string `json:"attach-state"`
	DataState    string `json:"data-state"`
	ConnectState string `json:"connect-state"`
	APN          string `json:"apn"`
	Gateway      string `json:"gateway"`
	RxErrors     int64  `json:"rx-errors"`
	TxErrors     int64  `json:"tx-errors"`
	RxDrops      int64  `json:"rx-drops"`
	TxDrops      int64  `json:"tx-drops"`
	RxBytes      int64  `json:"rx-bytes"`
	TxBytes      int64  `json:"tx-bytes"`
	Uptime       string `json:"uptime"`
	LastError    string `json:"last-error"`
}

// ─── Cellular Hardware ──────────────────────────────────────────────────────
// Modem hardware details

type CellularHardware struct {
	Interface   string `json:"if-name"`
	IMEI        string `json:"imei"`
	ICCID       string `json:"iccid"`
	IMSI        string `json:"imsi"`
	Carrier     string `json:"carrier"`
	ModemModel  string `json:"modem-model"`
	Firmware    string `json:"firmware-version"`
	Temperature int    `json:"temperature"`
	ModemState  string `json:"modem-state"`
	SIMStatus   string `json:"sim-status"`
	PhoneNumber string `json:"phone-number"`
	ESN         string `json:"esn"`
	PRI         string `json:"pri-version"`
}

// ─── Cellular Status (Aggregated) ───────────────────────────────────────────
// Combined view for quick status check

type CellularStatus struct {
	HasCellular bool                `json:"hasCellular"`
	IsConnected bool                `json:"isConnected"`
	Interfaces  []CellularInterface `json:"interfaces"`
	Connection  []json.RawMessage   `json:"connection,omitempty"`
	Session     []json.RawMessage   `json:"session,omitempty"`
	Hardware    []json.RawMessage   `json:"hardware,omitempty"`
	Transport   []json.RawMessage   `json:"transport,omitempty"`
	Error       string              `json:"error,omitempty"`
}

type CellularInterface struct {
	Name        string `json:"name"`
	IPAddress   string `json:"ipAddress"`
	IsConnected bool   `json:"isConnected"`
	SignalBars  int    `json:"signalBars"`
	RadioMode   string `json:"radioMode"`
	Carrier     string `json:"carrier"`
}

// FetchCellularConnection returns basic cellular connection info
func FetchCellularConnection(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/cellular/connection")
}

// FetchCellularSession returns EIOLTE session/operational state
func FetchCellularSession(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/cellularEiolte/connections")
}

// FetchCellularHardware returns modem hardware details
func FetchCellularHardware(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/cellularEiolte/hardware")
}

// FetchCellularTransport returns transport connection info
func FetchCellularTransport(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/transport/connection")
}

// FetchCellularStatus returns aggregated cellular status with hierarchical loading
// This is the primary endpoint - fetches connection first, then details if connected
func FetchCellularStatus(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		dev := requireDevice(apiClient, w, systemIP)
		if dev == nil {
			return // Error already written
		}

		// Use system-ip as deviceId (vManage expects IP, not UUID)
		status := CellularStatus{
			HasCellular: false,
			IsConnected: false,
			Interfaces:  []CellularInterface{},
		}

		// Step 1: Fetch connection status (lightweight, always fetch)
		connEndpoint := fmt.Sprintf("dataservice/device/cellular/connection?deviceId=%s", systemIP)
		connData, err := apiClient.Get(connEndpoint)
		if err != nil {
			log.Printf("Cellular connection fetch error: %v", err)
			status.Error = "Failed to fetch cellular connection"
			writeJSON(w, status)
			return
		}

		var connEnvelope struct {
			Data []json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(connData, &connEnvelope); err != nil {
			log.Printf("Cellular connection parse error: %v", err)
			status.Error = "Failed to parse cellular connection"
			writeJSON(w, status)
			return
		}

		// No cellular interfaces
		if len(connEnvelope.Data) == 0 {
			writeJSON(w, status)
			return
		}

		status.HasCellular = true
		status.Connection = connEnvelope.Data

		// Parse connection data to determine if connected
		for _, raw := range connEnvelope.Data {
			// Log raw data for debugging
			log.Printf("📱 Raw cellular connection data: %s", string(raw))

			var conn struct {
				Interface       string `json:"if-name"`
				IPAddress       string `json:"ip-address"`
				IPv4Address     string `json:"ipv4-address"`
				SessionState    string `json:"session-state"`
				PacketState     string `json:"pkt-session-status"`
				ConnectionState string `json:"connection-state"`
				DataState       string `json:"data-state"`
				RadioMode       string `json:"radio-mode"`
				SignalStrength  string `json:"signal-strength"`
				RSSI            int    `json:"rssi"`
				Modem           string `json:"modem"`
				Profile         string `json:"profile"`
			}
			if json.Unmarshal(raw, &conn) == nil {
				// Check multiple fields that could indicate connection status
				ipAddr := conn.IPAddress
				if ipAddr == "" {
					ipAddr = conn.IPv4Address
				}

				// Connection is up if: has IP, or session/packet/connection/data state indicates active
				sessionUp := conn.SessionState == "active" || conn.SessionState == "up" || conn.SessionState == "connected"
				packetUp := conn.PacketState == "active" || conn.PacketState == "up"
				connUp := conn.ConnectionState == "active" || conn.ConnectionState == "up" || conn.ConnectionState == "connected"
				dataUp := conn.DataState == "active" || conn.DataState == "up" || conn.DataState == "connected"
				hasIP := ipAddr != "" && ipAddr != "0.0.0.0"

				isConn := sessionUp || packetUp || connUp || dataUp || hasIP

				log.Printf("📱 Cellular %s: IP=%s, session=%s, packet=%s, conn=%s, data=%s → isConnected=%v",
					conn.Interface, ipAddr, conn.SessionState, conn.PacketState, conn.ConnectionState, conn.DataState, isConn)

				if isConn {
					status.IsConnected = true
				}

				// Calculate signal bars (0-5) from RSSI
				signalBars := 0
				if conn.RSSI >= -65 {
					signalBars = 5
				} else if conn.RSSI >= -75 {
					signalBars = 4
				} else if conn.RSSI >= -85 {
					signalBars = 3
				} else if conn.RSSI >= -95 {
					signalBars = 2
				} else if conn.RSSI >= -105 {
					signalBars = 1
				}

				status.Interfaces = append(status.Interfaces, CellularInterface{
					Name:        conn.Interface,
					IPAddress:   ipAddr,
					IsConnected: isConn,
					SignalBars:  signalBars,
					RadioMode:   conn.RadioMode,
				})
			}
		}

		// Step 2: If connected, fetch additional details in parallel
		if status.IsConnected {
			var wg sync.WaitGroup
			var mu sync.Mutex

			// Fetch EIOLTE session
			wg.Add(1)
			go func() {
				defer wg.Done()
				endpoint := fmt.Sprintf("dataservice/device/cellularEiolte/connections?deviceId=%s", systemIP)
				data, err := apiClient.Get(endpoint)
				if err != nil {
					log.Printf("EIOLTE session fetch error: %v", err)
					return
				}
				var env struct {
					Data []json.RawMessage `json:"data"`
				}
				if json.Unmarshal(data, &env) == nil && len(env.Data) > 0 {
					mu.Lock()
					status.Session = env.Data
					mu.Unlock()
				}
			}()

			// Fetch hardware info
			wg.Add(1)
			go func() {
				defer wg.Done()
				endpoint := fmt.Sprintf("dataservice/device/cellularEiolte/hardware?deviceId=%s", systemIP)
				data, err := apiClient.Get(endpoint)
				if err != nil {
					log.Printf("Cellular hardware fetch error: %v", err)
					return
				}
				var env struct {
					Data []json.RawMessage `json:"data"`
				}
				if json.Unmarshal(data, &env) == nil && len(env.Data) > 0 {
					mu.Lock()
					status.Hardware = env.Data

					// Extract carrier info
					for i, raw := range env.Data {
						var hw struct {
							Interface string `json:"if-name"`
							Carrier   string `json:"carrier"`
						}
						if json.Unmarshal(raw, &hw) == nil {
							for j := range status.Interfaces {
								if status.Interfaces[j].Name == hw.Interface || i == j {
									status.Interfaces[j].Carrier = hw.Carrier
									break
								}
							}
						}
					}
					mu.Unlock()
				}
			}()

			// Fetch transport info
			wg.Add(1)
			go func() {
				defer wg.Done()
				endpoint := fmt.Sprintf("dataservice/device/transport/connection?deviceId=%s", systemIP)
				data, err := apiClient.Get(endpoint)
				if err != nil {
					log.Printf("Transport connection fetch error: %v", err)
					return
				}
				var env struct {
					Data []json.RawMessage `json:"data"`
				}
				if json.Unmarshal(data, &env) == nil && len(env.Data) > 0 {
					mu.Lock()
					status.Transport = env.Data
					mu.Unlock()
				}
			}()

			wg.Wait()
		}

		log.Printf("📱 Cellular status for %s: hasCellular=%v, isConnected=%v, interfaces=%d",
			systemIP, status.HasCellular, status.IsConnected, len(status.Interfaces))

		writeJSON(w, status)
	}
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
