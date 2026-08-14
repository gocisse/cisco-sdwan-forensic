import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "interface", label: "Interface", minWidth: 120 },
  { field: "mac-address", label: "MAC Address", minWidth: 150 },
  { field: "ip-address", label: "IP Address", minWidth: 130 },
  { field: "hostname", label: "Hostname", minWidth: 120 },
  { field: "lease-time", label: "Lease Time" },
  { field: "expires", label: "Expires", minWidth: 160 },
  { field: "lastupdated", label: "Last Updated", minWidth: 160 },
];

export default function Dhcp() {
  return (
    <RealTimePage
      title="DHCP Leases"
      apiPath="/api/dhcp"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" || field === "expires")
          return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
