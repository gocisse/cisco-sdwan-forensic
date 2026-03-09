import React from "react";
import SSEPage from "../components/SSEPage";

const columns = [
  { field: "ifname", label: "Interface" },
  { field: "rx-kbps", label: "RX Kbps" },
  { field: "tx-kbps", label: "TX Kbps" },
  { field: "rx-packets", label: "RX Packets" },
  { field: "tx-packets", label: "TX Packets" },
  { field: "rx-errors", label: "RX Errors" },
  { field: "tx-errors", label: "TX Errors" },
];

export default function SSEInterfaceStats() {
  return (
    <SSEPage
      title="Live Interface Stats"
      eventPath="/events/interface-stats"
      columns={columns}
    />
  );
}
