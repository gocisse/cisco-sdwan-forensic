import React from "react";
import PolicyListPage from "../../components/PolicyListPage";

const columns = [
  { field: "name", label: "Name" },
  { field: "listId", label: "List ID" },
  { field: "type", label: "Type" },
  { field: "description", label: "Description" },
  { field: "lastUpdated", label: "Last Updated" },
  { field: "entries", label: "Queues" },
];

export default function SlaClassListPage() {
  return (
    <PolicyListPage
      title="SLA Class Lists"
      apiPath="/api/policy/list/class"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastUpdated" && value) return new Date(value).toLocaleString();
        if (field === "entries" && Array.isArray(value))
          return value.map((e) => e.queue).join(", ");
        return value ?? "—";
      }}
    />
  );
}
