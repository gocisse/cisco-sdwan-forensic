import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "source-ip", label: "Source IP" },
  { field: "dest-ip", label: "Dest IP" },
  { field: "source-port", label: "Src Port" },
  { field: "dest-port", label: "Dst Port" },
  { field: "tunnel-protocol", label: "Protocol" },
  { field: "ipsec-rx-failures", label: "RX Failures" },
  { field: "ipsec-tx-failures", label: "TX Failures" },
  { field: "lastupdated", label: "Last Updated" },
];

export default function Ipsec() {
  return (
    <RealTimePage
      title="IPSec Statistics"
      apiPath="/api/ipsec"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
