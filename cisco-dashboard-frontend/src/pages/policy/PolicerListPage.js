import React from "react";
import PolicyListPage from "../../components/PolicyListPage";

const columns = [
  { field: "name", label: "Name" },
  { field: "listId", label: "List ID" },
  { field: "type", label: "Type" },
  { field: "description", label: "Description" },
  { field: "lastUpdated", label: "Last Updated" },
  { field: "entries", label: "AS Paths" },
];

export default function PolicerListPage() {
  return (
    <PolicyListPage
      title="Policer Lists"
      apiPath="/api/policy/list/policer"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastUpdated" && value) return new Date(value).toLocaleString();
        if (field === "entries" && Array.isArray(value))
          return value.map((e) => e.asPath).join(", ");
        return value ?? "—";
      }}
    />
  );
}
