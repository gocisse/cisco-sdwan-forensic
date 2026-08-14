import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "ifname", label: "Interface", minWidth: 120 },
  { field: "vpn-id", label: "VPN" },
  { field: "oper-state", label: "Oper State" },
  { field: "admin-state", label: "Admin State" },
  { field: "ip-address", label: "IP Address", minWidth: 140 },
  { field: "mtu", label: "MTU" },
  { field: "duplex", label: "Duplex" },
  { field: "speed", label: "Speed" },
  { field: "mac-address", label: "MAC Address", minWidth: 140 },
  { field: "lastupdated", label: "Last Updated", minWidth: 160 },
];

export default function Interfaces() {
  return (
    <RealTimePage
      title="Interface Details"
      apiPath="/api/interfaces"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        if (field === "oper-state" || field === "admin-state") {
          const isUp = (value || "").toLowerCase() === "up";
          return isUp ? "up" : (value || "—");
        }
        return value ?? "—";
      }}
    />
  );
}
