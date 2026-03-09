import React, { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  AppBar,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  Speed as SpeedIcon,
  Hub as HubIcon,
  Policy as PolicyIcon,
  Stream as StreamIcon,
  Storage as StorageIcon,
  Shield as ShieldIcon,
  Analytics as AnalyticsIcon,
  NetworkCheck as NetworkCheckIcon,
  DeviceHub as DeviceHubIcon,
  VpnKey as VpnKeyIcon,
  Timeline as TimelineIcon,
  Dns as DnsIcon,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  FiberManualRecord as DotIcon,
} from "@mui/icons-material";
import logo from "../assets/logo.png";

const DRAWER_WIDTH = 260;

const navSections = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    items: [{ label: "Devices Overview", path: "/" }],
  },
  {
    label: "Troubleshoot",
    icon: <BuildIcon />,
    items: [
      { label: "Alarms", path: "/alarms" },
      { label: "Templates", path: "/templates" },
      { label: "Policy Forensics", path: "/policy-forensics" },
      { label: "SLA Analysis", path: "/sla-dashboard" },
    ],
  },
  {
    label: "Real-Time Monitoring",
    icon: <SpeedIcon />,
    items: [
      { label: "BFD Sessions", path: "/realtime/bfd", icon: <NetworkCheckIcon fontSize="small" /> },
      { label: "Tunnel Statistics", path: "/realtime/tunnel", icon: <StorageIcon fontSize="small" /> },
      { label: "App Routes", path: "/realtime/app-routes", icon: <TimelineIcon fontSize="small" /> },
      { label: "Control Plane", path: "/realtime/control-plane", icon: <DeviceHubIcon fontSize="small" /> },
      { label: "Connections", path: "/realtime/connections", icon: <DnsIcon fontSize="small" /> },
      { label: "IPSec Stats", path: "/realtime/ipsec", icon: <VpnKeyIcon fontSize="small" /> },
      { label: "Advertised Routes", path: "/realtime/advertised-routes" },
      { label: "Received Routes", path: "/realtime/received-routes" },
      { label: "Advertised TLOCs", path: "/realtime/advertised-tlocs" },
      { label: "Received TLOCs", path: "/realtime/received-tlocs" },
    ],
  },
  {
    label: "Topology",
    icon: <HubIcon />,
    items: [
      { label: "Network Graph", path: "/topology" },
      { label: "Site View", path: "/sitetopology" },
    ],
  },
  {
    label: "Centralized Policies",
    icon: <PolicyIcon />,
    items: [
      { label: "Control Definitions", path: "/policy/definitions/control" },
      { label: "Data Definitions", path: "/policy/definitions/data" },
      { label: "App-Route Definitions", path: "/policy/definitions/approute" },
      { label: "QoS Map", path: "/policy/definitions/qosmap" },
      { label: "SLA Lists", path: "/policy/list/sla" },
      { label: "Site Lists", path: "/policy/list/sites" },
      { label: "VPN Lists", path: "/policy/list/vpn" },
      { label: "Prefix Lists", path: "/policy/list/prefix" },
      { label: "IP Prefix Lists", path: "/policy/list/ipprefix" },
      { label: "App Lists", path: "/policy/list/app" },
      { label: "Color Lists", path: "/policy/list/color" },
      { label: "Data Prefix All", path: "/policy/list/dataprefixall" },
      { label: "SLA Class", path: "/policy/list/class" },
      { label: "Policer Lists", path: "/policy/list/policer" },
      { label: "TLOC Lists", path: "/policy/list/tloc" },
    ],
  },
  {
    label: "Edge Policies",
    icon: <ShieldIcon />,
    items: [
      { label: "ACL Associations", path: "/edgepolicy/accesslistassociations" },
      { label: "ACL Counters", path: "/edgepolicy/accesslistcounters" },
      { label: "ACL Names", path: "/edgepolicy/accesslistnames" },
      { label: "ACL Policers", path: "/edgepolicy/accesslistpolicers" },
      { label: "App-Route Filter", path: "/edgepolicy/approutepolicyfilter" },
      { label: "Data Policy Filter", path: "/edgepolicy/datapolicyfilter" },
      { label: "Device Policer", path: "/edgepolicy/devicepolicer" },
      { label: "QoS Map Info", path: "/edgepolicy/qosmapinfo" },
      { label: "QoS Scheduler", path: "/edgepolicy/qosschedulerinfo" },
      { label: "vSmart Policy", path: "/edgepolicy/vsmart" },
    ],
  },
  {
    label: "Live Data (SSE)",
    icon: <StreamIcon />,
    items: [
      { label: "Live BFD", path: "/sse/bfd", icon: <AnalyticsIcon fontSize="small" /> },
      { label: "Live Interface Usage", path: "/sse/interface-usage" },
      { label: "Live Interface Stats", path: "/sse/interface-stats" },
    ],
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ Dashboard: true, Troubleshoot: true });

  const toggleSection = (label) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo + Title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          py: 2.5,
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        <Box
          component="img"
          src={logo}
          alt="Logo"
          sx={{ width: 36, height: 36, borderRadius: 1 }}
        />
        <Box>
          <Typography variant="subtitle1" sx={{ color: "#fff", lineHeight: 1.2, fontSize: "0.9rem" }}>
            Cisco-Sdwan
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem" }}>
            Forensic Dashboard
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
        {navSections.map((section) => (
          <React.Fragment key={section.label}>
            <ListItemButton
              onClick={() =>
                section.items.length === 1
                  ? navigate(section.items[0].path)
                  : toggleSection(section.label)
              }
              sx={{ py: 0.8 }}
            >
              <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)", minWidth: 36 }}>
                {section.icon}
              </ListItemIcon>
              <ListItemText
                primary={section.label}
                primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}
              />
              {section.items.length > 1 &&
                (openSections[section.label] ? (
                  <ExpandLess sx={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }} />
                ) : (
                  <ExpandMore sx={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }} />
                ))}
            </ListItemButton>
            {section.items.length > 1 && (
              <Collapse in={openSections[section.label]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {section.items.map((item) => (
                    <ListItemButton
                      key={item.path}
                      selected={isActive(item.path)}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      sx={{ pl: 5.5, py: 0.4 }}
                    >
                      {item.icon && (
                        <ListItemIcon sx={{ color: "rgba(255,255,255,0.5)", minWidth: 28 }}>
                          {item.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "0.8rem",
                          color: isActive(item.path) ? "#00BCB4" : "rgba(255,255,255,0.7)",
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* Footer */}
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
      <Box sx={{ px: 2.5, py: 1.5 }}>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
          v1.0.0 &middot; Cisco SD-WAN Forensic
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        {/* AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: "#fff",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2, display: { md: "none" }, color: "text.primary" }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, color: "text.primary", fontSize: "1.1rem" }}>
              Cisco-Sdwan-Forensic
            </Typography>
            <Chip
              icon={<DotIcon sx={{ fontSize: 10 }} />}
              label="Connected"
              size="small"
              color="success"
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <IconButton onClick={() => window.location.reload()} size="small">
              <RefreshIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: "background.default" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
