// // src/components/Navbar.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [showPolicyDropdown, setShowPolicyDropdown] = useState(false);
  const [showDefinitionsDropdown, setShowDefinitionsDropdown] = useState(false);
  const [showSseDropdown, setShowSseDropdown] = useState(false);
  const [showRealTimeDropdown, setShowRealTimeDropdown] = useState(false);
  const [showEdgePolicyDropdown, setShowEdgePolicyDropdown] = useState(false);
  const [showTopologyDropdown, setShowTopologyDropdown] = useState(false);

  return (
    <nav className="navbar">
      {/* Left Section: Dashboard */}
      <div className="navbar-left">
        <ul className="navbar-left-links">
          <li>
            <Link to="/">AT&T</Link>
          </li>
        </ul>
      </div>

      {/* Center Section: Logo/Title */}
      <div className="navbar-center">
        <Link to="/" className="navbar-logo">
          Cisco SD-WAN
        </Link>
      </div>

      {/* Right Section: Navigation Links */}
      <div className="navbar-right">
        <ul className="navbar-right-links">
          {/* RealTime Dropdown */}
          <li
            className="dropdown"
            onMouseEnter={() => setShowRealTimeDropdown(true)}
            onMouseLeave={() => setShowRealTimeDropdown(false)}
          >
            <button className="dropbtn">RealTime ▾</button>
            {showRealTimeDropdown && (
              <ul className="dropdown-content">
                <li>
                  <Link to="/realtime/advertised-routes">Advertised Routes</Link>
                </li>
                <li>
                  <Link to="/realtime/received-routes">Received Routes</Link>
                </li>
                <li>
                  <Link to="/realtime/advertised-tlocs">Advertised TLOCs</Link>
                </li>
                <li>
                  <Link to="/realtime/received-tlocs">Received TLOCs</Link>
                </li>
                <li>
                  <Link to="/realtime/app-routes">App Routes</Link>
                </li>
                <li>
                  <Link to="/realtime/bfd">BFD</Link>
                </li>
                <li>
                  <Link to="/realtime/connections">Connections</Link>
                </li>
                <li>
                  <Link to="/realtime/control-plane">Control Plane</Link>
                </li>
                <li>
                  <Link to="/realtime/ipsec">IPSec</Link>
                </li>
                <li>
                  <Link to="/realtime/tunnel">Tunnel</Link>
                </li>
              </ul>
            )}
          </li>

          {/* Policy Dropdown */}
          <li
            className="dropdown"
            onMouseEnter={() => setShowPolicyDropdown(true)}
            onMouseLeave={() => setShowPolicyDropdown(false)}
          >
            <button className="dropbtn">Policy ▾</button>
            {showPolicyDropdown && (
              <ul className="dropdown-content">
                <li>
                  <Link to="/policy/list/sla">SLA Policies</Link>
                </li>
                <li>
                  <Link to="/policy/list/prefix">Data Prefix Policies</Link>
                </li>
                <li>
                  <Link to="/policy/list/sites">Site Policies</Link>
                </li>
                <li>
                  <Link to="/policy/list/ipprefix">IP Prefix Policies</Link>
                </li>
                <li>
                  <Link to="/policy/list/vpn">VPN Policies</Link>
                </li>
                <li>
                  <Link to="/policy/list/app">App Policies</Link>
                </li>
                <li>
                  <Link to="/policy/list/color">Color Policies</Link>
                </li>
                <li>
                  <Link to="/policy/list/dataprefixall">Data Prefix All</Link>
                </li>
                <li>
                  <Link to="/policy/list/class">SLA Class Lists</Link>
                </li>
                <li>
                  <Link to="/policy/list/policer">Policer Lists</Link>
                </li>
                <li>
                  <Link to="/policy/definitions/qosmap">QoS Map Policies</Link>
                </li>
                <li>
                  <Link to="/policy/list/tloc">TLOC Lists</Link>
                </li>
              </ul>
            )}
          </li>

          {/* Edge Policy Dropdown */}
          <li
            className="dropdown"
            onMouseEnter={() => setShowEdgePolicyDropdown(true)}
            onMouseLeave={() => setShowEdgePolicyDropdown(false)}
          >
            <button className="dropbtn">Edge Policy ▾</button>
            {showEdgePolicyDropdown && (
              <ul className="dropdown-content">
                <li>
                  <Link to="/edgepolicy/accesslistassociations">
                    Access List Associations
                  </Link>
                </li>
                <li>
                  <Link to="/edgepolicy/accesslistcounters">
                    Access List Counters
                  </Link>
                </li>
                <li>
                  <Link to="/edgepolicy/accesslistnames">Access List Names</Link>
                </li>
                <li>
                  <Link to="/edgepolicy/accesslistpolicers">
                    Access List Policers
                  </Link>
                </li>
                <li>
                  <Link to="/edgepolicy/approutepolicyfilter">
                    App Route Policy Filter
                  </Link>
                </li>
                <li>
                  <Link to="/edgepolicy/datapolicyfilter">
                    Data Policy Filter
                  </Link>
                </li>
                <li>
                  <Link to="/edgepolicy/devicepolicer">Device Policer</Link>
                </li>
                <li>
                  <Link to="/edgepolicy/qosmapinfo">QoS Map Info</Link>
                </li>
                <li>
                  <Link to="/edgepolicy/qosschedulerinfo">
                    QoS Scheduler Info
                  </Link>
                </li>
                <li>
                  <Link to="/edgepolicy/vsmart">vSmart Policy</Link>
                </li>
              </ul>
            )}
          </li>

          {/* Definitions Dropdown */}
          <li
            className="dropdown"
            onMouseEnter={() => setShowDefinitionsDropdown(true)}
            onMouseLeave={() => setShowDefinitionsDropdown(false)}
          >
            <button className="dropbtn">Definitions ▾</button>
            {showDefinitionsDropdown && (
              <ul className="dropdown-content">
                <li>
                  <Link to="/policy/definitions/approute">
                    AppRoute Policies
                  </Link>
                </li>
                <li>
                  <Link to="/policy/definitions/control">
                    Control Policies
                  </Link>
                </li>
                <li>
                  <Link to="/policy/definitions/data">
                    Data Definition Policies
                  </Link>
                </li>
                <li>
                  <Link to="/policy/definitions/qosmap">QoS Map Policies</Link>
                </li>
              </ul>
            )}
          </li>

          {/* SSE Dropdown */}
          <li
            className="dropdown"
            onMouseEnter={() => setShowSseDropdown(true)}
            onMouseLeave={() => setShowSseDropdown(false)}
          >
            <button className="dropbtn">Live Data (SSE) ▾</button>
            {showSseDropdown && (
              <ul className="dropdown-content">
                <li>
                  <Link to="/sse/bfd">BFD Sessions</Link>
                </li>
                <li>
                  <Link to="/sse/interface-usage">Interface Usage</Link>
                </li>
                <li>
                  <Link to="/sse/interface-stats">Interface Stats</Link>
                </li>
              </ul>
            )}
          </li>

          {/* Topology Dropdown */}
          <li
            className="dropdown"
            onMouseEnter={() => setShowTopologyDropdown(true)}
            onMouseLeave={() => setShowTopologyDropdown(false)}
          >
            <button className="dropbtn">Topology ▾</button>
            {showTopologyDropdown && (
              <ul className="dropdown-content">
                <li>
                  <Link to="/topology">BFD Topology</Link>
                </li>
                <li>
                  <Link to="/sitetopology">Site Topology</Link>
                </li>
              </ul>
            )}
          </li>

          {/* Templates */}
          <li>
            <Link to="/templates" className="dropbtn" style={{ textDecoration: 'none' }}>
              Templates
            </Link>
          </li>

          {/* Policy Forensics */}
          <li>
            <Link to="/policy-forensics" className="dropbtn" style={{ textDecoration: 'none' }}>
              Forensics
            </Link>
          </li>

          {/* SLA Dashboard */}
          <li>
            <Link to="/sla-dashboard" className="dropbtn" style={{ textDecoration: 'none' }}>
              SLA
            </Link>
          </li>

          {/* Alarms */}
          <li>
            <Link to="/alarms" className="dropbtn" style={{ textDecoration: 'none' }}>
              Alarms
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
