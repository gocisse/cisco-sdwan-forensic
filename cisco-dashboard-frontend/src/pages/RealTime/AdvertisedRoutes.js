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

export default function AdvertisedRoutes() {
  return (
    <RealTimePage
      title="Advertised Routes"
      apiPath="/api/routes/advertised"
      navigateTo="/realtime/advertised-routes/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
