import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "source-ip", label: "Source IP" },
  { field: "dest-ip", label: "Dest IP" },
  { field: "source-port", label: "Src Port" },
  { field: "dest-port", label: "Dst Port" },
  { field: "tunnel-protocol", label: "Protocol" },
  { field: "state", label: "State" },
  { field: "local-color", label: "Local Color" },
  { field: "remote-color", label: "Remote Color" },
  { field: "lastupdated", label: "Last Updated" },
];

export default function Bfd() {
  return (
    <RealTimePage
      title="BFD Sessions"
      apiPath="/api/bfd"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
