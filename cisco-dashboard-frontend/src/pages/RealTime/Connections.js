import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "system-ip", label: "System IP" },
  { field: "state", label: "State" },
  { field: "protocol", label: "Protocol" },
  { field: "peer-type", label: "Peer Type" },
  { field: "uptime", label: "Uptime" },
  { field: "local-color", label: "Local Color" },
  { field: "remote-color", label: "Remote Color" },
  { field: "private-ip", label: "Private IP" },
  { field: "public-ip", label: "Public IP" },
  { field: "lastupdated", label: "Last Updated" },
];

export default function Connections() {
  return (
    <RealTimePage
      title="Control Connections"
      apiPath="/api/connections"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
