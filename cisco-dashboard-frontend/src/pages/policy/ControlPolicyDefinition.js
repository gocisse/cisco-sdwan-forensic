import React, { useState } from "react";
import PolicyListPage from "../../components/PolicyListPage";
import PolicyDrillDown from "../../components/PolicyDrillDown";

const columns = [
  { field: "name", label: "Name" },
  { field: "type", label: "Type" },
  { field: "description", label: "Description" },
  { field: "owner", label: "Owner" },
  { field: "lastUpdated", label: "Last Updated" },
  { field: "referenceCount", label: "Refs" },
];

export default function ControlPolicyDefinition() {
  const [drillDown, setDrillDown] = useState({ open: false, type: "", id: "", name: "" });

  return (
    <>
      <PolicyListPage
        title="Control Policy Definitions"
        apiPath="/api/policies/control"
        columns={columns}
        renderCell={(field, value) => {
          if (field === "lastUpdated" && value) return new Date(value).toLocaleString();
          return value ?? "—";
        }}
        onRowClick={(row) =>
          setDrillDown({ open: true, type: "control", id: row.definitionId, name: row.name })
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
