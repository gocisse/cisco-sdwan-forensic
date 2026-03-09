import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "name", label: "Name" },
  { field: "vdevice-dataKey", label: "Data Key" },
  { field: "vdevice-name", label: "Device Name" },
  { field: "lastupdated", label: "Last Updated" },
  { field: "vdevice-host-name", label: "Hostname" },
];

export default function AccessListNames() {
  return (
    <RealTimePage
      title="Access List Names"
      apiPath="/api/edgepolicy/accesslistnames"
      navigateTo="/edgepolicy/accesslistnames/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
