import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "name", label: "Name" },
  { field: "direction", label: "Direction" },
  { field: "rate", label: "Rate" },
  { field: "burst", label: "Burst" },
  { field: "oos-action", label: "OOS Action" },
  { field: "oos-bytes", label: "OOS Bytes" },
  { field: "oos-pkts", label: "OOS Pkts" },
  { field: "index", label: "Index" },
  { field: "lastupdated", label: "Last Updated" },
  { field: "vdevice-name", label: "Device Name" },
  { field: "vdevice-host-name", label: "Hostname" },
];

export default function DevicePolicer() {
  return (
    <RealTimePage
      title="Device Policer"
      apiPath="/api/edgepolicy/devicepolicer"
      navigateTo="/edgepolicy/devicepolicer/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
