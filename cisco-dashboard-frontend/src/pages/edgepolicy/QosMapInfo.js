import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "qos-map-name", label: "QoS Map Name" },
  { field: "lastupdated", label: "Last Updated" },
  { field: "vdevice-dataKey", label: "Data Key" },
  { field: "vdevice-name", label: "Device Name" },
  { field: "vdevice-host-name", label: "Hostname" },
];

export default function QosMapInfo() {
  return (
    <RealTimePage
      title="QoS Map Info"
      apiPath="/api/edgepolicy/qosmapinfo"
      navigateTo="/edgepolicy/qosmapinfo/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
