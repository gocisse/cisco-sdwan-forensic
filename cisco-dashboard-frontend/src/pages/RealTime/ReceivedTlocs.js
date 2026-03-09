import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "vdevice-name", label: "Device" },
  { field: "color", label: "Color" },
  { field: "ip", label: "IP" },
  { field: "tloc-auth-type", label: "Auth Type" },
  { field: "encap", label: "Encap" },
  { field: "from-peer", label: "From Peer" },
  { field: "lastupdated", label: "Last Updated" },
];

export default function ReceivedTlocs() {
  return (
    <RealTimePage
      title="Received TLOCs"
      apiPath="/api/tlocs/received"
      navigateTo="/realtime/received-tlocs/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
