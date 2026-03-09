// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { DeviceProvider } from "./context/DeviceContext";

import Dashboard from "./pages/Dashboard";
import DeviceDetail from "./pages/DeviceDetail";
import TemplateView from "./pages/TemplateView";
import PolicyForensics from "./pages/PolicyForensics";
import SLADashboard from "./pages/SLADashboard";
import Alarms from "./pages/Alarms";
import AdvertisedRoutes from "./pages/RealTime/AdvertisedRoutes";
import ReceivedRoutes from "./pages/RealTime/ReceivedRoutes";
import AdvertisedTlocs from "./pages/RealTime/AdvertisedTlocs";
import ReceivedTlocs from "./pages/RealTime/ReceivedTlocs";
import AppRoutes from "./pages/RealTime/AppRoutes";
import Bfd from "./pages/RealTime/Bfd";
import Connections from "./pages/RealTime/Connections";
import ControlPlane from "./pages/RealTime/ControlPlane";
import Ipsec from "./pages/RealTime/Ipsec";
import Tunnel from "./pages/RealTime/Tunnel";
import SSEBfd from "./pages/SSEBfd";
import SSEInterfaceUsage from "./pages/SSEInterfaceUsage";
import SSEInterfaceStats from "./pages/SSEInterfaceStats";
import TopologyPage from "./pages/Topology";
import SiteTopology from "./pages/SiteTopology";

import SlaPolicyList from "./pages/policy/SlaPolicyList";
import DataPrePolicyfixList from "./pages/policy/DataPrePolicyfixList";
import SitePolicyList from "./pages/policy/SitePolicyList";
import IpPrefixPolicyList from "./pages/policy/IpPrefixPolicyList";
import VpnPolicyList from "./pages/policy/VpnPolicyList";
import AppPolicyList from "./pages/policy/AppPolicyList";
import AppRoutePolicyDefinition from "./pages/policy/AppRoutePolicyDefinition";
import ControlPolicyDefinition from "./pages/policy/ControlPolicyDefinition";
import ColorPolicyList from "./pages/policy/ColorPolicyList";
import DataDefinitionList from "./pages/policy/DataDefinitionList";
import DataPrefixAllList from "./pages/policy/DataPrefixAllList";
import SlaClassListPage from "./pages/policy/SlaClassListPage";
import PolicerListPage from "./pages/policy/PolicerListPage";
import QosMapListPage from "./pages/policy/QosMapListPage";
import TlocListPage from "./pages/policy/TlocListPage";

import AccessListAssociations from "./pages/edgepolicy/AccessListAssociations";
import AccessListCounters from "./pages/edgepolicy/AccessListCounters";
import AccessListNames from "./pages/edgepolicy/AccessListNames";
import AccessListPolicers from "./pages/edgepolicy/AccessListPolicers";
import AppRoutePolicyFilter from "./pages/edgepolicy/AppRoutePolicyFilter";
import DataPolicyFilter from "./pages/edgepolicy/DataPolicyFilter";
import DevicePolicer from "./pages/edgepolicy/DevicePolicer";
import QosMapInfo from "./pages/edgepolicy/QosMapInfo";
import QosSchedulerInfo from "./pages/edgepolicy/QosSchedulerInfo";
import VsmartPolicy from "./pages/edgepolicy/VsmartPolicy";

function App() {
  return (
    <Router>
      <DeviceProvider>
      <Navbar />
      <Routes>
        {/* Home */}
        <Route path="/" element={<Dashboard />} />

        {/* Device Detail (click-through from Dashboard) */}
        <Route path="/device/:systemIp" element={<DeviceDetail />} />

        {/* Alarms */}
        <Route path="/alarms" element={<Alarms />} />

        {/* Template Hierarchy */}
        <Route path="/templates/:systemIp?" element={<TemplateView />} />

        {/* Policy Forensics */}
        <Route path="/policy-forensics/:systemIp?" element={<PolicyForensics />} />

        {/* SLA & Traffic Analysis */}
        <Route path="/sla-dashboard/:systemIp?" element={<SLADashboard />} />

        {/* RealTime endpoints — with optional :systemIp for deep-linking */}
        <Route path="/realtime/advertised-routes/:systemIp?" element={<AdvertisedRoutes />} />
        <Route path="/realtime/received-routes/:systemIp?" element={<ReceivedRoutes />} />
        <Route path="/realtime/advertised-tlocs/:systemIp?" element={<AdvertisedTlocs />} />
        <Route path="/realtime/received-tlocs/:systemIp?" element={<ReceivedTlocs />} />
        <Route path="/realtime/app-routes/:systemIp?" element={<AppRoutes />} />
        <Route path="/realtime/bfd/:systemIp?" element={<Bfd />} />
        <Route path="/realtime/connections/:systemIp?" element={<Connections />} />
        <Route path="/realtime/control-plane/:systemIp?" element={<ControlPlane />} />
        <Route path="/realtime/ipsec/:systemIp?" element={<Ipsec />} />
        <Route path="/realtime/tunnel/:systemIp?" element={<Tunnel />} />

        {/* Policy Routes */}
        <Route path="/policy/list/sla" element={<SlaPolicyList />} />
        <Route path="/policy/list/prefix" element={<DataPrePolicyfixList />} />
        <Route path="/policy/list/sites" element={<SitePolicyList />} />
        <Route path="/policy/list/ipprefix" element={<IpPrefixPolicyList />} />
        <Route path="/policy/list/vpn" element={<VpnPolicyList />} />
        <Route path="/policy/list/app" element={<AppPolicyList />} />
        <Route path="/policy/list/color" element={<ColorPolicyList />} />
        <Route path="/policy/list/dataprefixall" element={<DataPrefixAllList />} />
        <Route path="/policy/list/class" element={<SlaClassListPage />} />
        <Route path="/policy/list/policer" element={<PolicerListPage />} />
        <Route path="/policy/definitions/qosmap" element={<QosMapListPage />} />
        <Route path="/policy/list/tloc" element={<TlocListPage />} />
        <Route path="/policy/definitions/approute" element={<AppRoutePolicyDefinition />} />
        <Route path="/policy/definitions/control" element={<ControlPolicyDefinition />} />
        <Route path="/policy/definitions/data" element={<DataDefinitionList />} />

        {/* SSE Routes */}
        <Route path="/sse/bfd" element={<SSEBfd />} />
        <Route path="/sse/interface-usage" element={<SSEInterfaceUsage />} />
        <Route path="/sse/interface-stats" element={<SSEInterfaceStats />} />

        {/* Topology */}
        <Route path="/topology" element={<TopologyPage />} />
        <Route path="/sitetopology" element={<SiteTopology />} />

        {/* Edge Policy Routes */}
        <Route path="/edgepolicy/accesslistassociations/:systemIp?" element={<AccessListAssociations />} />
        <Route path="/edgepolicy/accesslistcounters/:systemIp?" element={<AccessListCounters />} />
        <Route path="/edgepolicy/accesslistnames/:systemIp?" element={<AccessListNames />} />
        <Route path="/edgepolicy/accesslistpolicers/:systemIp?" element={<AccessListPolicers />} />
        <Route path="/edgepolicy/approutepolicyfilter/:systemIp?" element={<AppRoutePolicyFilter />} />
        <Route path="/edgepolicy/datapolicyfilter/:systemIp?" element={<DataPolicyFilter />} />
        <Route path="/edgepolicy/devicepolicer/:systemIp?" element={<DevicePolicer />} />
        <Route path="/edgepolicy/qosmapinfo/:systemIp?" element={<QosMapInfo />} />
        <Route path="/edgepolicy/qosschedulerinfo/:systemIp?" element={<QosSchedulerInfo />} />
        <Route path="/edgepolicy/vsmart" element={<VsmartPolicy />} />
      </Routes>
      </DeviceProvider>
    </Router>
  );
}

export default App;

