import React from "react";
import PolicyListPage from "../../components/PolicyListPage";

const columns = [
  { field: "name", label: "Name" },
  { field: "listId", label: "List ID" },
  { field: "type", label: "Type" },
  { field: "description", label: "Description" },
  { field: "lastUpdated", label: "Last Updated" },
  { field: "entries", label: "Colors" },
];

export default function ColorPolicyList() {
  return (
    <PolicyListPage
      title="Color Policies"
      apiPath="/api/policy/color"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastUpdated" && value) return new Date(value).toLocaleString();
        if (field === "entries" && Array.isArray(value))
          return value.map((e) => e.color).join(", ");
        return value ?? "—";
      }}
    />
  );
}
