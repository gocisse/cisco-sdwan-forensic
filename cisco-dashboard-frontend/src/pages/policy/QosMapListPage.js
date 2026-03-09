import React from "react";
import PolicyListPage from "../../components/PolicyListPage";

const columns = [
  { field: "name", label: "Name" },
  { field: "definitionId", label: "Definition ID" },
  { field: "type", label: "Type" },
  { field: "description", label: "Description" },
  { field: "lastUpdated", label: "Last Updated" },
  { field: "owner", label: "Owner" },
  { field: "mode", label: "Mode" },
  { field: "optimized", label: "Optimized" },
];

export default function QosMapListPage() {
  return (
    <PolicyListPage
      title="QoS Map Policies"
      apiPath="/api/policy/definition/qosmap"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastUpdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
