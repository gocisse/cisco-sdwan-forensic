import React, { useState } from "react";
import PolicyListPage from "../../components/PolicyListPage";
import PolicyDrillDown from "../../components/PolicyDrillDown";

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

export default function DataDefinitionList() {
  const [drillDown, setDrillDown] = useState({ open: false, type: "", id: "", name: "" });

  return (
    <>
      <PolicyListPage
        title="Data Definition Policies"
        apiPath="/api/policy/definition/data"
        columns={columns}
        renderCell={(field, value) => {
          if (field === "lastUpdated" && value) return new Date(value).toLocaleString();
          return value ?? "—";
        }}
        onRowClick={(row) =>
          setDrillDown({ open: true, type: "data", id: row.definitionId, name: row.name })
        }
      />
      <PolicyDrillDown
        open={drillDown.open}
        onClose={() => setDrillDown({ open: false, type: "", id: "", name: "" })}
        policyType={drillDown.type}
        policyId={drillDown.id}
        policyName={drillDown.name}
      />
    </>
  );
}
