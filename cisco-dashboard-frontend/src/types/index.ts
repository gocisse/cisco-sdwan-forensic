/**
 * Central export for all types
 */

export * from "./device";
export * from "./template";
export * from "./policy";
export * from "./topology";

/**
 * Generic API response wrapper (for endpoints that return { data: [...] })
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * API error response structure
 */
export interface ApiError {
  error: string;
  code: string;
  status: number;
  details?: string;
}

/**
 * Alarm from /api/alarms
 */
export interface Alarm {
  uuid: string;
  severity: "Critical" | "Major" | "Minor" | "Warning" | "Informational";
  component: string;
  "host-name": string;
  "system-ip": string;
  "site-id": string;
  message: string;
  "entry-time": number;
  "cleared-time"?: number;
  active: boolean;
  acknowledged: boolean;
}

/**
 * BFD Session from /api/bfd/{system-ip}
 */
export interface BfdSession {
  "system-ip": string;
  "src-ip": string;
  "dst-ip": string;
  color: string;
  "local-color": string;
  state: "up" | "down" | "init";
  proto: string;
  uptime: string;
  "uptime-date": number;
  "tx-interval": number;
  transitions: number;
  "site-id": string | number;
  "vdevice-host-name": string;
  "vdevice-name": string;
  lastupdated: number;
}

/**
 * Tunnel statistics from /api/tunnel/{system-ip}
 */
export interface TunnelStats {
  "system-ip": string;
  "src-ip": string;
  "dst-ip": string;
  color: string;
  "local-color": string;
  state: string;
  "tx-pkts": number;
  "rx-pkts": number;
  "tx-octets": number;
  "rx-octets": number;
  "tcp-mss-adjust": number;
}

/**
 * OMP Route from /api/routes/received/{system-ip} or /api/routes/advertised/{system-ip}
 */
export interface OmpRoute {
  prefix: string;
  "from-peer": string;
  "vpn-id": string;
  "site-id": string;
  "originator-ip": string;
  "omp-tag": string;
  "omp-preference": number;
  "omp-origin": string;
  "omp-path-id": number;
  label: number;
  status: string;
  "protocol-sub-type": string;
}

/**
 * TLOC from /api/tlocs/received/{system-ip} or /api/tlocs/advertised/{system-ip}
 */
export interface Tloc {
  "system-ip": string;
  color: string;
  encap: string;
  "site-id": string;
  preference: number;
  weight: number;
  "originator-ip": string;
  status: string;
}
