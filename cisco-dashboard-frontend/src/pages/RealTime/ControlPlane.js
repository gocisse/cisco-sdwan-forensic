import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "vdevice-name", label: "Device" },
  { field: "peer", label: "Peer" },
  { field: "state", label: "State" },
  { field: "type", label: "Type" },
  { field: "site-id", label: "Site ID" },
  { field: "domain-id", label: "Domain ID" },
  { field: "up-time", label: "Uptime" },
  { field: "lastupdated", label: "Last Updated" },
];

export default function ControlPlane() {
  return (
    <RealTimePage
      title="Control Plane"
      apiPath="/api/control-plane"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
