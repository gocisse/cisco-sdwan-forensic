/**
 * Device types for Cisco SD-WAN Forensic Dashboard
 * These types mirror the backend models/device.go structures
 */

/**
 * Device represents a device record from vManage /dataservice/device API.
 */
export interface Device {
  "system-ip": string;
  "host-name": string;
  uuid?: string;
  deviceId?: string;
  "device-type": string;
  personality?: string;
  "device-model": string;
  "site-id": string;
  reachability: "reachable" | "unreachable";
  status?: string;
  "device-os"?: string;
  version?: string;
  template?: string;
  templateId?: string;
  "certificate-validity"?: string;
  controlConnections?: string;
  "uptime-date"?: number;
  "board-serial"?: string;
  "platform-family"?: string;
}

/**
 * DeviceDetails is the enriched device information returned by /api/device/{system-ip}/details
 */
export interface DeviceDetails {
  systemIp: string;
  hostName: string;
  deviceId: string;
  deviceModel: string;
  siteId: string;
  reachability: string;
  status: string;
  deviceOs: string;
  template: string;
  templateId: string;
  certValidity: string;
  controlConnections: string;
  uptimeDate: number;
}

/**
 * Helper type guards
 */
export function isReachable(device: Device): boolean {
  return device.reachability === "reachable";
}

export function isController(device: Device): boolean {
  const dt = (device["device-type"] || "").toLowerCase();
  return dt.includes("vmanage") || dt.includes("vsmart") || dt.includes("vbond");
}

/**
 * Device role types
 */
export type DeviceRole = "vmanage" | "vsmart" | "vbond" | "cedge" | "vedge" | "edge" | "unknown";

export function getDeviceRole(device: Device): DeviceRole {
  const dt = (device["device-type"] || device.personality || "").toLowerCase();
  const model = (device["device-model"] || "").toLowerCase();

  if (dt.includes("vmanage")) return "vmanage";
  if (dt.includes("vsmart")) return "vsmart";
  if (dt.includes("vbond")) return "vbond";
  if (dt.includes("cedge") || model.includes("c8") || model.includes("isr") || model.includes("asr")) return "cedge";
  if (dt.includes("vedge")) return "vedge";
  if (dt.includes("edge")) return "edge";
  return "unknown";
}
