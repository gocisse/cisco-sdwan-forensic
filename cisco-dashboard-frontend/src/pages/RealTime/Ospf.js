import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "neighbor-ip", label: "Neighbor IP", minWidth: 130 },
  { field: "router-id", label: "Router ID", minWidth: 130 },
  { field: "state", label: "State" },
  { field: "area", label: "Area" },
  { field: "priority", label: "Priority" },
  { field: "dead-time", label: "Dead Time" },
  { field: "lastupdated", label: "Last Updated", minWidth: 160 },
];

export default function Ospf() {
  return (
    <RealTimePage
      title="OSPF Neighbors"
      apiPath="/api/ospf"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
        if (field === "state") {
          const isFull = (value || "").toLowerCase() === "full";
          return isFull ? "Full" : (value || "—");
        }
        return value ?? "—";
      }}
    />
  );
}
