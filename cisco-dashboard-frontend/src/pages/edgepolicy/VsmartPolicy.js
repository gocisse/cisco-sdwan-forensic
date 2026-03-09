import React from "react";
import { Chip } from "@mui/material";
import PolicyListPage from "../../components/PolicyListPage";

const columns = [
  { field: "policyName", label: "Policy Name" },
  { field: "policyVersion", label: "Version" },
  { field: "policyType", label: "Type" },
  { field: "policyDescription", label: "Description" },
  { field: "lastUpdatedBy", label: "Updated By" },
  { field: "createdOn", label: "Created On" },
  { field: "lastUpdatedOn", label: "Last Updated" },
  { field: "isPolicyActivated", label: "Activated" },
];

export default function VsmartPolicy() {
  return (
    <PolicyListPage
      title="vSmart Policy"
      apiPath="/api/edgepolicy/vsmart"
      columns={columns}
      renderCell={(field, value) => {
        if ((field === "createdOn" || field === "lastUpdatedOn") && value)
          return new Date(value).toLocaleString();
        if (field === "isPolicyActivated")
          return (
            <Chip
              label={value ? "Yes" : "No"}
              color={value ? "success" : "default"}
              size="small"
            />
          );
        return value ?? "—";
      }}
    />
  );
}
