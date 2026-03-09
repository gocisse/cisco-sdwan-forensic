import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "name", label: "Name" },
  { field: "interface-name", label: "Interface" },
  { field: "interface-direction", label: "Direction" },
  { field: "lastupdated", label: "Last Updated" },
  { field: "vdevice-name", label: "Device Name" },
  { field: "vdevice-dataKey", label: "Data Key" },
  { field: "vdevice-host-name", label: "Hostname" },
];

export default function AccessListAssociations() {
  return (
    <RealTimePage
      title="Access List Associations"
      apiPath="/api/edgepolicy/accesslistassociations"
      navigateTo="/edgepolicy/accesslistassociations/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
