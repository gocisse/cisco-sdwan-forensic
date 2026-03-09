import React from "react";
import PolicyListPage from "../../components/PolicyListPage";

const columns = [
  { field: "name", label: "Name" },
  { field: "listId", label: "List ID" },
  { field: "type", label: "Type" },
  { field: "description", label: "Description" },
  { field: "lastUpdated", label: "Last Updated" },
  { field: "entries", label: "IP Prefixes" },
];

export default function DataPrefixAllList() {
  return (
    <PolicyListPage
      title="Data Prefix All Policies"
      apiPath="/api/policy/list/dataprefixall"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastUpdated" && value) return new Date(value).toLocaleString();
        if (field === "entries" && Array.isArray(value))
          return value.map((e) => e.ipPrefix).join(", ");
        return value ?? "—";
      }}
    />
  );
}
