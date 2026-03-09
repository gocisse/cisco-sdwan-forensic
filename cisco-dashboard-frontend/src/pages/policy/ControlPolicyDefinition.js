import React from "react";
import PolicyListPage from "../../components/PolicyListPage";

const columns = [
  { field: "name", label: "Name" },
  { field: "type", label: "Type" },
  { field: "description", label: "Description" },
  { field: "owner", label: "Owner" },
  { field: "lastUpdated", label: "Last Updated" },
  { field: "referenceCount", label: "Refs" },
];

export default function ControlPolicyDefinition() {
  return (
    <PolicyListPage
      title="Control Policy Definitions"
      apiPath="/api/policies/control"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastUpdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
