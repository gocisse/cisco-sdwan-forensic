import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "name", label: "Name" },
  { field: "lastupdated", label: "Last Updated" },
  { field: "vdevice-dataKey", label: "Data Key" },
  { field: "vdevice-name", label: "Device Name" },
  { field: "vdevice-host-name", label: "Hostname" },
];

export default function AccessListPolicers() {
  return (
    <RealTimePage
      title="Access List Policers"
      apiPath="/api/edgepolicy/accesslistpolicers"
      navigateTo="/edgepolicy/accesslistpolicers/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
