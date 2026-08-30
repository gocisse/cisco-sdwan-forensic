package models

// RelationshipType indicates the source/type of a relationship.
type RelationshipType string

const (
	RelTypeDataPlane RelationshipType = "data-plane" // From BFD sessions
	RelTypeControl   RelationshipType = "control"    // From control connections
	RelTypeSite      RelationshipType = "site"       // From site topology
)

// TransportSession represents a single BFD/IPsec tunnel within a relationship.
type TransportSession struct {
	Color       string `json:"color"`
	State       string `json:"state"`
	SrcIP       string `json:"srcIp"`
	DstIP       string `json:"dstIp"`
	Proto       string `json:"proto"`
	Uptime      string `json:"uptime"`
	UptimeDate  int64  `json:"uptimeDate,omitempty"`
	TxInterval  int    `json:"txInterval,omitempty"`
	Transitions int    `json:"transitions,omitempty"`
	LastUpdated int64  `json:"lastUpdated,omitempty"`
}

// ControlConnection represents a control plane connection detail.
type ControlConnection struct {
	State      string `json:"state"`
	PeerType   string `json:"peerType"`
	Protocol   string `json:"protocol"`
	LocalColor string `json:"localColor"`
	Uptime     string `json:"uptime"`
}

// SiteLink represents a site topology link detail.
type SiteLink struct {
	LinkType string `json:"linkType"`
	Status   string `json:"status"`
	LinkKey  string `json:"linkKey"`
}

// Relationship represents a logical connection between the selected device and a peer.
type Relationship struct {
	PeerIP            string              `json:"peerIp"`
	PeerHostname      string              `json:"peerHostname"`
	PeerType          string              `json:"peerType"`
	SiteID            interface{}         `json:"siteId"`
	Importance        int                 `json:"importance"`
	HealthStatus      string              `json:"healthStatus"`
	HealthRatio       float64             `json:"healthRatio"`
	RelationshipTypes []RelationshipType  `json:"relationshipTypes"`
	Transports        []TransportSession  `json:"transports"`
	ControlConns      []ControlConnection `json:"controlConns,omitempty"`
	SiteLinks         []SiteLink          `json:"siteLinks,omitempty"`
	ActiveCount       int                 `json:"activeCount"`
	TotalCount        int                 `json:"totalCount"`
	UniqueColors      []string            `json:"uniqueColors,omitempty"`
}

// HealthSummary provides aggregate health statistics.
type HealthSummary struct {
	Healthy  int `json:"healthy"`
	Degraded int `json:"degraded"`
	Down     int `json:"down"`
	Unknown  int `json:"unknown"`
}

// LogicalTopologyResponse is the aggregated topology for a selected device.
type LogicalTopologyResponse struct {
	SelectedDevice   string         `json:"selectedDevice"`
	SelectedHostname string         `json:"selectedHostname"`
	Relationships    []Relationship `json:"relationships"`
	TotalPeers       int            `json:"totalPeers"`
	HiddenCount      int            `json:"hiddenCount"`
	HealthSummary    HealthSummary  `json:"healthSummary"`
}

// OmpPeer represents an OMP routing peer with route information.
type OmpPeer struct {
	PeerIP       string   `json:"peerIp"`
	PeerHostname string   `json:"peerHostname"`
	PeerType     string   `json:"peerType"`
	SiteID       string   `json:"siteId"`
	RouteCount   int      `json:"routeCount"`
	VpnIDs       []string `json:"vpnIds"`
	Prefixes     []string `json:"prefixes"`
}

// OmpTopologyResponse is the OMP routing topology for a device.
type OmpTopologyResponse struct {
	SelectedDevice   string    `json:"selectedDevice"`
	SelectedHostname string    `json:"selectedHostname"`
	Peers            []OmpPeer `json:"peers"`
	TotalPeers       int       `json:"totalPeers"`
	TotalRoutes      int       `json:"totalRoutes"`
}

// BFDSession represents a raw BFD session from vManage.
type BFDSession struct {
	SystemIP        string      `json:"system-ip"`
	SrcIP           string      `json:"src-ip"`
	DstIP           string      `json:"dst-ip"`
	Color           string      `json:"color"`
	LocalColor      string      `json:"local-color"`
	State           string      `json:"state"`
	Proto           string      `json:"proto"`
	Uptime          string      `json:"uptime"`
	UptimeDate      int64       `json:"uptime-date"`
	TxInterval      int         `json:"tx-interval"`
	Transitions     int         `json:"transitions"`
	SiteID          interface{} `json:"site-id"`
	VdeviceHostName string      `json:"vdevice-host-name"`
	VdeviceName     string      `json:"vdevice-name"`
	LastUpdated     int64       `json:"lastupdated"`
}
