import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "sensor-name", label: "Sensor", minWidth: 120 },
  { field: "temperature", label: "Temperature" },
  { field: "status", label: "Status" },
  { field: "min-temp", label: "Min Temp" },
  { field: "max-temp", label: "Max Temp" },
  { field: "lastupdated", label: "Last Updated", minWidth: 160 },
];

export default function Environment() {
  return (
    <RealTimePage
      title="Environment Sensors"
      apiPath="/api/environment"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
