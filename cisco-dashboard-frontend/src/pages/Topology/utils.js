/**
 * Topology utility functions
 */

import { CONTROL_ROLES, ROLE_STYLE } from "./constants";

/**
 * Get the role key for a device
 */
export function getRoleKey(dev) {
  if (!dev) return "unknown";
  const dt = (dev["device-type"] || dev.personality || "").toLowerCase();
  if (dt.includes("vmanage")) return "vmanage";
  if (dt.includes("vsmart")) return "vsmart";
  if (dt.includes("vbond")) return "vbond";
  if (dt.includes("cedge") || dt.includes("c8000")) return "cedge";
  if (dt.includes("vedge") || dt.includes("edge")) return "vedge";
  return "unknown";
}

/**
 * Check if a device is up (reachable)
 */
export function devIsUp(dev) {
  return dev && (dev.reachability || "").toLowerCase() === "reachable";
}

/**
 * Create a Cytoscape node from a device
 */
export function makeNode(dev, ip) {
  const role = getRoleKey(dev);
  const s = ROLE_STYLE[role] || ROLE_STYLE.unknown;
  const up = devIsUp(dev);
  const hostname = dev ? dev["host-name"] || ip : ip;
  const classes = [];
  if (CONTROL_ROLES.includes(role)) classes.push("control");
  classes.push(up ? "up" : "down");

  return {
    data: {
      id: ip,
      label: hostname,
      role,
      bgColor: s.bg,
      borderColor: up ? "#00E676" : "#FF1744",
      shape: s.shape,
      icon: s.icon,
      systemIp: ip,
      hostname,
      status: up ? "reachable" : "unreachable",
      deviceType: dev ? dev["device-type"] || dev.personality || "N/A" : "N/A",
      siteId: dev ? dev["site-id"] || "N/A" : "N/A",
    },
    classes: classes.join(" "),
  };
}

/**
 * Build a device map from an array of devices
 */
export function buildDeviceMap(devices) {
  const m = {};
  (devices || []).forEach((d) => {
    m[d["system-ip"]] = d;
  });
  return m;
}

/**
 * Separate controllers from edge devices
 */
export function separateDevices(devices) {
  const controllers = [];
  const edgeDevices = [];
  (devices || []).forEach((d) => {
    const role = getRoleKey(d);
    if (CONTROL_ROLES.includes(role)) {
      controllers.push(d);
    } else {
      edgeDevices.push(d);
    }
  });
  return { controllers, edgeDevices };
}
