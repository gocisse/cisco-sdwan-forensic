import React from "react";
import RealTimePage from "../../components/RealTimePage";

const columns = [
  { field: "vpn-name", label: "VPN Name" },
  { field: "policy-name", label: "Policy Name" },
  { field: "counter-name", label: "Counter" },
  { field: "bytes", label: "Bytes" },
  { field: "packets", label: "Packets" },
  { field: "lastupdated", label: "Last Updated" },
  { field: "vdevice-name", label: "Device Name" },
  { field: "vdevice-host-name", label: "Hostname" },
];

export default function AppRoutePolicyFilter() {
  return (
    <RealTimePage
      title="App Route Policy Filter"
      apiPath="/api/edgepolicy/approutepolicyfilter"
      navigateTo="/edgepolicy/approutepolicyfilter/"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "lastupdated" && value) return new Date(value).toLocaleString();
        return value ?? "—";
      }}
    />
  );
}
