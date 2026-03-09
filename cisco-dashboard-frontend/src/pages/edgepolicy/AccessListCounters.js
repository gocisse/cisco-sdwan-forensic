import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "name", label: "Name" },
  { field: "counter-name", label: "Counter" },
  { field: "bytes", label: "Bytes" },
  { field: "packets", label: "Packets" },
  { field: "lastupdated", label: "Last Updated" },
  { field: "vdevice-name", label: "Device Name" },
  { field: "vdevice-host-name", label: "Hostname" },
];

export default function AccessListCounters() {
  return (
    <RealTimePage
      title="Access List Counters"
      apiPath="/api/edgepolicy/accesslistcounters"
      navigateTo="/edgepolicy/accesslistcounters/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
