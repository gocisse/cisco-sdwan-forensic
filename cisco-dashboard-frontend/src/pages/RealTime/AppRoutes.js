import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "vdevice-host-name", label: "Hostname" },
  { field: "src-ip", label: "Source IP" },
  { field: "dst-ip", label: "Dest IP" },
  { field: "remote-color", label: "Remote Color" },
  { field: "proto", label: "Protocol" },
  { field: "average-latency", label: "Avg Latency" },
  { field: "average-jitter", label: "Avg Jitter" },
  { field: "loss", label: "Loss" },
  { field: "lastupdated", label: "Last Updated" },
];

export default function AppRoutes() {
  return (
    <RealTimePage
      title="App-Aware Routes"
      apiPath="/api/app-routes"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
