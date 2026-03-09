import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "source-ip", label: "Source IP" },
  { field: "dest-ip", label: "Dest IP" },
  { field: "source-port", label: "Src Port" },
  { field: "dest-port", label: "Dst Port" },
  { field: "tunnel-protocol", label: "Protocol" },
  { field: "local-color", label: "Local Color" },
  { field: "remote-color", label: "Remote Color" },
  { field: "rx_pkts", label: "RX Packets" },
  { field: "tx_pkts", label: "TX Packets" },
  { field: "rx_octets", label: "RX Octets" },
  { field: "tx_octets", label: "TX Octets" },
  { field: "lastupdated", label: "Last Updated" },
];

export default function Tunnel() {
  return (
    <RealTimePage
      title="Tunnel Statistics"
      apiPath="/api/tunnel"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
