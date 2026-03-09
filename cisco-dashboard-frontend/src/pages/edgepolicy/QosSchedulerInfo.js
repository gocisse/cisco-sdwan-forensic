import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "qos-scheduler-name", label: "Scheduler Name" },
  { field: "qos-map-name", label: "QoS Map Name" },
  { field: "bandwidth-percent", label: "Bandwidth %" },
  { field: "buffer-percent", label: "Buffer %" },
  { field: "lastupdated", label: "Last Updated" },
  { field: "vdevice-name", label: "Device Name" },
  { field: "vdevice-host-name", label: "Hostname" },
];

export default function QosSchedulerInfo() {
  return (
    <RealTimePage
      title="QoS Scheduler Info"
      apiPath="/api/edgepolicy/qosschedulerinfo"
      navigateTo="/edgepolicy/qosschedulerinfo/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
