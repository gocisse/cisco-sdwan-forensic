import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "prefix", label: "Prefix" },
  { field: "protocol", label: "Protocol" },
  { field: "color", label: "Color" },
  { field: "from-peer", label: "From Peer" },
  { field: "overlay-id", label: "Overlay ID" },
  { field: "lastupdated", label: "Last Updated" },
];

export default function ReceivedRoutes() {
  return (
    <RealTimePage
      title="Received Routes"
      apiPath="/api/routes/received"
      navigateTo="/realtime/received-routes/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
