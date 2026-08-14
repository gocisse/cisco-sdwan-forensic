import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "peer-ip", label: "Peer IP", minWidth: 130 },
  { field: "peer-as", label: "Peer AS" },
  { field: "state", label: "State" },
  { field: "uptime", label: "Uptime" },
  { field: "prefixes-received", label: "Prefixes Rx" },
  { field: "prefixes-sent", label: "Prefixes Tx" },
  { field: "state-time", label: "State Time" },
  { field: "lastupdated", label: "Last Updated", minWidth: 160 },
];

export default function Bgp() {
  return (
    <RealTimePage
      title="BGP Neighbors"
      apiPath="/api/bgp"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" || field === "state-time")
          return value ? new Date(value).toLocaleString() : "—";
        if (field === "state") {
          const isEstablished = (value || "").toLowerCase() === "established";
          return isEstablished ? "Established" : (value || "—");
        }
        return value ?? "—";
      }}
    />
  );
}
