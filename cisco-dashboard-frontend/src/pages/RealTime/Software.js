import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "name", label: "Name", minWidth: 120 },
  { field: "part-number", label: "Part Number", minWidth: 130 },
  { field: "serial-number", label: "Serial Number", minWidth: 140 },
  { field: "slot", label: "Slot" },
  { field: "state", label: "State" },
  { field: "lastupdated", label: "Last Updated", minWidth: 160 },
];

export default function Hardware() {
  return (
    <RealTimePage
      title="Hardware Inventory"
      apiPath="/api/hardware"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        return value ?? "—";
      }}
    />
  );
}
