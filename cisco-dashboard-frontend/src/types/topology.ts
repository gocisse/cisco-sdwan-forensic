/**
 * Topology types for Cisco SD-WAN Forensic Dashboard
 * These types mirror the backend models/topology.go structures
 */

/**
 * RelationshipType indicates the source/type of a relationship.
 */
export type RelationshipType = "data-plane" | "control" | "site";

/**
 * TransportSession represents a single BFD/IPsec tunnel within a relationship.
 */
export interface TransportSession {
  color: string;
  state: string;
  srcIp: string;
  dstIp: string;
  proto: string;
  uptime: string;
  uptimeDate?: number;
  txInterval?: number;
  transitions?: number;
  lastUpdated?: number;
}

/**
 * ControlConnection represents a control plane connection detail.
 */
export interface ControlConnection {
  state: string;
  peerType: string;
  protocol: string;
  localColor: string;
  uptime: string;
}

/**
 * SiteLink represents a site topology link detail.
 */
export interface SiteLink {
  linkType: string;
  status: string;
  linkKey: string;
}

/**
 * Relationship represents a logical connection between the selected device and a peer.
 */
export interface Relationship {
  peerIp: string;
  peerHostname: string;
  peerType: string;
  siteId: string | number;
  importance: number;
  healthStatus: "healthy" | "degraded" | "down" | "unknown";
  healthRatio: number;
  relationshipTypes: RelationshipType[];
  transports: TransportSession[];
  controlConns?: ControlConnection[];
  siteLinks?: SiteLink[];
  activeCount: number;
  totalCount: number;
  uniqueColors?: string[];
}

/**
 * HealthSummary provides aggregate health statistics.
 */
export interface HealthSummary {
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
}

/**
 * LogicalTopologyResponse is the response from /api/topology/logical/{system-ip}
 */
export interface LogicalTopologyResponse {
  selectedDevice: string;
  selectedHostname: string;
  relationships: Relationship[];
  totalPeers: number;
  hiddenCount: number;
  healthSummary: HealthSummary;
}

/**
 * OmpPeer represents an OMP routing peer with route information.
 */
export interface OmpPeer {
  peerIp: string;
  peerHostname: string;
  peerType: string;
  siteId: string;
  routeCount: number;
  vpnIds: string[];
  prefixes: string[];
}

/**
 * OmpTopologyResponse is the response from /api/topology/omp/{system-ip}
 */
export interface OmpTopologyResponse {
  selectedDevice: string;
  selectedHostname: string;
  peers: OmpPeer[];
  totalPeers: number;
  totalRoutes: number;
}

/**
 * Transport / tunnel color map for visualization
 */
export const TRANSPORT_COLORS: Record<string, string> = {
  "public-internet": "#E53935",
  "biz-internet": "#1E88E5",
  "3g": "#3357FF",
  lte: "#FF33A8",
  blue: "#007acc",
  green: "#43A047",
  red: "#FF0000",
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  custom1: "#8A2BE2",
  custom2: "#FF8C00",
  custom3: "#20B2AA",
  mpls: "#F4A460",
  "metro-ethernet": "#8A2BE2",
  private1: "#FFA500",
  private2: "#A52A2A",
  default: "#78909C",
};

/**
 * Get the color for a transport type
 */
export function getTransportColor(transport: string): string {
  return TRANSPORT_COLORS[transport.toLowerCase()] || TRANSPORT_COLORS.default;
}
