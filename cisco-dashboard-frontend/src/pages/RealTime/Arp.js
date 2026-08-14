import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "ip-address", label: "IP Address", minWidth: 130 },
  { field: "mac-address", label: "MAC Address", minWidth: 150 },
  { field: "interface", label: "Interface", minWidth: 120 },
  { field: "vpn-id", label: "VPN" },
  { field: "state", label: "State" },
  { field: "lastupdated", label: "Last Updated", minWidth: 160 },
];

export default function Arp() {
  return (
    <RealTimePage
      title="ARP Table"
      apiPath="/api/arp"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
