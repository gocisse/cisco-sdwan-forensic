<p align="center">
  <img src="cisco-dashboard-frontend/src/assets/logo.png" alt="Cisco SD-WAN Forensic" width="80" />
</p>

<h1 align="center">Cisco SD-WAN Forensic Dashboard</h1>

<p align="center">
  A standalone forensic analysis tool for Cisco SD-WAN (Viptela) fabrics.<br/>
  Connects directly to vManage via API — no agents, no cloud dependencies, no installation required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/MUI-5-007FFF?logo=mui&logoColor=white" />
  <img src="https://img.shields.io/badge/Cytoscape.js-Graph-FF6F00" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## What Is This?

**Cisco SD-WAN Forensic** is a single-binary diagnostic dashboard that connects to your Cisco vManage and provides deep visibility into your SD-WAN fabric. It is designed for network engineers who need to quickly troubleshoot, audit policies, and understand traffic flow — without navigating through dozens of vManage screens.

**Key differentiator**: This tool focuses on *forensic analysis* — answering questions like:
- "What policies are actually affecting traffic on this device?"
- "Why is this tunnel down?"
- "What routes is this device receiving and from whom?"
- "How does the template hierarchy look for this device?"

---

## Features

### 📊 Device Dashboard
- Card-based overview of all devices in your fabric
- Reachability status (up/down) at a glance
- Search/filter by hostname, system-ip, model, or site ID
- Click any device to drill into its details

### 🔍 Device Detail & Quick Navigation
- Full device information: system-ip, device ID, model, site, OS, certificate status, uptime
- One-click navigation to any real-time view, policy forensics, SLA analysis, or template hierarchy for that device

### 🛡️ Policy Forensics (Impact Analysis)
- **Two-column forensic view**: Local Policy (device template) vs. Centralized Policy (vSmart)
- **Template hierarchy**: Shows the full device template → feature template tree
- **Local policy breakdown**: ACLs, Zone-Based Firewall, QoS Maps, Policers
- **Centralized policy breakdown**: Data Policies, Control Policies, App-Route Policies with full sequence flow (Match → Action)
- **Traffic Flow Impact Summary**: Plain-English explanation of how policies combine to affect traffic on the device
- **Policy Drill-Down**: Click any policy name to see its full definition with all sequences, matches, and actions

### 🌐 Network Topology (Cytoscape.js)
Two distinct visualization modes:

| View | Description |
|------|-------------|
| **Control Plane** | Hierarchical layout (dagre) — Controllers (vManage, vSmart, vBond) at top, Edges at bottom. Lines represent control connections. Always clean and readable. |
| **BFD Tunnels** | Star topology centered on a selected device. Shows only direct BFD peers (~5–15 connections). Edges color-coded by transport (blue=biz-internet, red=public-internet, tan=MPLS, etc.). |

- Double-click a node in Control Plane → auto-switches to BFD view for that device
- Single-click highlights neighborhood, dims everything else
- Hover tooltip shows hostname, system-ip, device type, site ID, status

### 📈 SLA & Traffic Analysis
- **App-Route Flows**: Per-flow SLA metrics (latency, loss, jitter) with OK/Warning/Critical classification
- **Tunnel Health**: All tunnels with source IP, dest IP, local/remote color, state, TX/RX packets, loss percentage
- Live data via SSE (Server-Sent Events) when available

### ⚡ Real-Time Monitoring
Per-device real-time data from vManage, all with searchable/sortable tables:

| Page | Data Source |
|------|------------|
| BFD Sessions | `device/tunnel/bfd_statistics` |
| Tunnel Statistics | `device/tunnel/statistics` |
| App Routes | `device/app-route/statistics` |
| Control Plane (Synced) | `device/control/synced/connections` |
| Connections | `device/control/connections` |
| IPSec Local SA | `device/ipsec/localsa` |
| Received Routes | `device/omp/routes/received` (with **prefix search**) |
| Advertised Routes | `device/omp/routes/advertised` (with **prefix search**) |
| Received TLOCs | `device/omp/tlocs/received` |
| Advertised TLOCs | `device/omp/tlocs/advertised` |

> **Route Search**: Received/Advertised Routes support server-side prefix filtering. Search for a specific subnet (e.g. `10.0.0` or `172.16`) instead of loading the entire routing table — critical for devices with 10k+ routes.

### 📋 Centralized Policy Browser
Browse all vManage centralized policy objects:

- **Definitions**: Control, Data, App-Route, QoS Map
- **Lists**: SLA, Site, VPN, Prefix, IP Prefix, App, Color, Data Prefix, SLA Class, Policer, TLOC
- Click any definition to see its full sequence/rule structure in a drill-down modal

### 🛡️ Edge Policy Inspector
Per-device edge policy data:

- ACL Associations, Counters, Names, Policers
- App-Route Policy Filter, Data Policy Filter
- Device Policer, QoS Map Info, QoS Scheduler
- vSmart Policy view

### 📡 Live Data (SSE Streams)
Real-time Server-Sent Event streams that auto-refresh:

- **Live BFD** — BFD session changes pushed in real time
- **Live Interface Usage** — Interface utilization updates
- **Live Interface Stats** — Interface counters (errors, drops, etc.)
- **Live App-Route** — App-route SLA changes pushed in real time

### 🏗️ Template Hierarchy Viewer
- Visual tree of Device Template → Feature Templates → Sub-Templates
- Shows template name, type, description at every level
- Collapsible tree nodes for complex hierarchies

### 🚨 Alarms
- Full alarm table with severity, component, hostname, site, time, active/cleared status
- Search, sort, and filter across all alarm fields

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React SPA)                │
│  Material UI · Cytoscape.js · SSE EventSource        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────▼──────────────────────────────┐
│              Go Backend (single binary)              │
│                                                      │
│  ┌─────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ REST API│  │ SSE Broker │  │ Static File Server│  │
│  │ /api/*  │  │ /events/* │  │ /static/* + SPA   │  │
│  └────┬────┘  └─────┬─────┘  └───────────────────┘  │
│       │             │                                │
│  ┌────▼─────────────▼────┐                           │
│  │    vManage API Client  │                           │
│  │  (auth, XSRF, retry,  │                           │
│  │   proxy, PAC resolve)  │                           │
│  └────────────┬──────────┘                           │
└───────────────┼──────────────────────────────────────┘
                │ HTTPS
┌───────────────▼──────────────────────────────────────┐
│           Cisco vManage (on-prem or cloud)            │
│              /dataservice/* REST API                  │
└──────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **Single binary** — no Docker, no Node.js runtime, no database. Just download and run.
- **Frontend embedded** — React build output is bundled alongside the binary.
- **Proxy-aware** — supports direct HTTP proxies and auto-resolves PAC files.
- **Session management** — handles vManage authentication, XSRF tokens, session expiry with automatic re-authentication.
- **UUID resolution** — many vManage endpoints require the device UUID, not the system-ip. The backend transparently resolves this.

---

## Quick Start

### 1. Download

Go to [Releases](https://github.com/gocisse/cisco-sdwan-forensic/releases) and download the zip for your platform:

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `cisco-forenzic-vX.X.X-darwin-arm64.zip` |
| macOS (Intel) | `cisco-forenzic-vX.X.X-darwin-amd64.zip` |
| Linux (x64) | `cisco-forenzic-vX.X.X-linux-amd64.zip` |
| Linux (ARM) | `cisco-forenzic-vX.X.X-linux-arm64.zip` |
| Windows (x64) | `cisco-forenzic-vX.X.X-windows-amd64.zip` |

### 2. Extract

```bash
# macOS / Linux
unzip cisco-forenzic-vX.X.X-darwin-arm64.zip
cd cisco-forenzic-vX.X.X-darwin-arm64

# Windows
# Right-click the zip → Extract All
```

Your folder should contain:
```
├── cisco-forenzic-darwin-arm64   # (or .exe on Windows)
├── frontend/                     # Pre-built React app
└── .env.example                  # Proxy configuration template
```

### 3. Configure Proxy (if needed)

If you are behind a corporate proxy:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Direct proxy
PROXY_URL=http://proxy.company.com:8080
PROXY_USER=DOMAIN\your.username
PROXY_PASS=your-password

# OR PAC file (auto-resolved)
PROXY_URL=http://autoproxy.company.com/autoproxy.cgi
```

> **Note:** The app auto-detects PAC file URLs and resolves the actual proxy server automatically.

If you have **no proxy**, skip this step entirely.

### 4. Run

```bash
# macOS / Linux
chmod +x cisco-forenzic-darwin-arm64
./cisco-forenzic-darwin-arm64

# Windows
cisco-forenzic-windows-amd64.exe
```

You will be prompted for:

```
Enter vManage URL: https://your-vmanage.company.com
Enter Username: admin
Enter Password: ********
Enter Port Number: 8080
```

### 5. Open

Navigate to **http://localhost:8080** (or whatever port you chose).

---

## Usage Guide

### Selecting a Device

All device-scoped pages require a device selection. You can:
1. **Global search bar** (top of page) — type a hostname or system-ip
2. **Dashboard cards** — click any device card to go to its detail page
3. **Device detail quick nav** — click any tile to jump to that view for the device

### Policy Forensics Workflow

1. Navigate to **Troubleshoot → Policy Forensics**
2. Select a device
3. View the two-column layout:
   - **Left**: Local policies (ACLs, QoS, Firewall) from the device template
   - **Right**: Centralized policies (Data, Control, App-Route) from vSmart
4. Read the **Traffic Flow Impact** summary at the bottom
5. Click any policy name to **drill down** into its full definition

### Topology Workflow

1. Navigate to **Topology → Network Graph**
2. **Control Plane view** (default): See all controllers and edges in a clean hierarchy
3. **Double-click** any node to switch to **BFD Tunnels view** for that device
4. Use the toggle buttons to switch between views manually

### Route Search

1. Navigate to **Real-Time Monitoring → Received Routes** (or Advertised Routes)
2. Select a device
3. Enter a prefix in the search bar (e.g. `10.0.0` or `192.168`)
4. Click **Search Routes** — only matching routes are returned
5. Use **Load All** if you need the full routing table (may be slow on large devices)

---

## Building from Source

### Prerequisites

- **Go 1.23+**
- **Node.js 18+** and **npm**

### Build Frontend

```bash
cd cisco-dashboard-frontend
npm install
npm run build
```

### Build Backend

```bash
# Current platform
go build -o cisco-forenzic -ldflags="-s -w" .

# Cross-compile for all platforms
GOOS=darwin  GOARCH=arm64 go build -o cisco-forenzic-darwin-arm64  -ldflags="-s -w" .
GOOS=darwin  GOARCH=amd64 go build -o cisco-forenzic-darwin-amd64  -ldflags="-s -w" .
GOOS=linux   GOARCH=amd64 go build -o cisco-forenzic-linux-amd64   -ldflags="-s -w" .
GOOS=linux   GOARCH=arm64 go build -o cisco-forenzic-linux-arm64   -ldflags="-s -w" .
GOOS=windows GOARCH=amd64 go build -o cisco-forenzic-windows-amd64.exe -ldflags="-s -w" .
```

### Run in Development

```bash
# Terminal 1: Backend (serves API on :8080)
go run .

# Terminal 2: Frontend dev server (proxies API to :8080)
cd cisco-dashboard-frontend
npm start
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go 1.23, Gorilla Mux, godotenv |
| **Frontend** | React 18, Material UI 5, Cytoscape.js, cytoscape-dagre |
| **Data Transport** | REST API + Server-Sent Events (SSE) |
| **Build** | Single static binary (Go) + pre-built SPA (React) |
| **Auth** | vManage session cookie + XSRF token (auto-managed) |

---

## API Endpoints

<details>
<summary>Click to expand full API reference</summary>

### Device & General
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | List all devices |
| GET | `/api/alarms` | List all alarms |
| GET | `/api/device/{system-ip}/details` | Device details |
| GET | `/api/device/{system-ip}/templates` | Template hierarchy |

### Policy Forensics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/device/{system-ip}/policy/local` | Local policy (ACLs, QoS, firewall) |
| GET | `/api/device/{system-ip}/policy/centralized` | Centralized policies affecting this device |
| GET | `/api/policy/definition/{type}/{id}` | Full policy definition drill-down |

### Traffic Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/device/{system-ip}/app-route` | App-route flows with SLA classification |
| GET | `/api/device/{system-ip}/tunnel-health` | Tunnel health with loss calculation |

### Real-Time (device-scoped)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/control-plane/{system-ip}` | Synced control connections |
| GET | `/api/connections/{system-ip}` | Control connections |
| GET | `/api/routes/received/{system-ip}?prefix=` | OMP received routes (filterable) |
| GET | `/api/routes/advertised/{system-ip}?prefix=` | OMP advertised routes (filterable) |
| GET | `/api/tlocs/received/{system-ip}` | Received TLOCs |
| GET | `/api/tlocs/advertised/{system-ip}` | Advertised TLOCs |
| GET | `/api/app-routes/{system-ip}` | App-route statistics |
| GET | `/api/bfd/{system-ip}` | BFD statistics |
| GET | `/api/tunnel/{system-ip}` | Tunnel statistics |
| GET | `/api/ipsec/{system-ip}` | IPSec local SA |

### Topology
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topology/{system-ip}` | BFD sessions for topology graph |
| GET | `/api/topology/site/{system-ip}` | Site topology |

### Centralized Policies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/policies/control` | Control policy definitions |
| GET | `/api/policies/approute` | App-route policy definitions |
| GET | `/api/policy/definition/data` | Data policy definitions |
| GET | `/api/policies/sla` | SLA lists |
| GET | `/api/policies/sites` | Site lists |
| GET | `/api/policies/vpn` | VPN lists |
| GET | `/api/policies/prefix` | Data prefix lists |
| GET | `/api/policies/ipprefix` | IP prefix lists |
| GET | `/api/policies/app` | App lists |
| GET | `/api/policy/color` | Color lists |
| GET | `/api/policy/list/dataprefixall` | Data prefix all |
| GET | `/api/policy/list/class` | SLA class lists |
| GET | `/api/policy/list/policer` | Policer lists |
| GET | `/api/policy/definition/qosmap` | QoS map definitions |
| GET | `/api/policy/list/tloc` | TLOC lists |

### Edge Policies (device-scoped)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/edgepolicy/accesslistassociations/{system-ip}` | ACL associations |
| GET | `/api/edgepolicy/accesslistcounters/{system-ip}` | ACL counters |
| GET | `/api/edgepolicy/accesslistnames/{system-ip}` | ACL names |
| GET | `/api/edgepolicy/accesslistpolicers/{system-ip}` | ACL policers |
| GET | `/api/edgepolicy/approutepolicyfilter/{system-ip}` | App-route policy filter |
| GET | `/api/edgepolicy/datapolicyfilter/{system-ip}` | Data policy filter |
| GET | `/api/edgepolicy/devicepolicer/{system-ip}` | Device policer |
| GET | `/api/edgepolicy/qosmapinfo/{system-ip}` | QoS map info |
| GET | `/api/edgepolicy/qosschedulerinfo/{system-ip}` | QoS scheduler info |
| GET | `/api/edgepolicy/vsmart` | vSmart policy |

### SSE (Server-Sent Events)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events/bfd?system-ip=` | Live BFD updates |
| GET | `/events/interface-usage?system-ip=` | Live interface usage |
| GET | `/events/interface-stats?system-ip=` | Live interface stats |
| GET | `/events/app-route?system-ip=` | Live app-route updates |

</details>

---

## Troubleshooting

### Connection Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `timeout awaiting response headers` | Corporate proxy blocking traffic | Set `PROXY_URL` in `.env` |
| `Proxy Authorization Required (407)` | Proxy needs credentials | Set `PROXY_USER` and `PROXY_PASS` in `.env` |
| `certificate` / `x509` error | Proxy intercepting TLS | Set the proxy URL so traffic routes correctly |
| `authentication failed: login page` | Wrong username/password | Verify vManage credentials |
| Routes page timeout | Large routing table (10k+ routes) | Use the **prefix search** feature instead of loading all |

### Common Questions

**Q: Does this modify anything on vManage?**
A: No. This tool is **read-only**. It only uses GET requests to fetch data from vManage APIs. Nothing is written, modified, or deleted.

**Q: Does it work with multi-tenant vManage?**
A: Yes. The tool handles multi-tenant session management and XSRF token refresh automatically.

**Q: What vManage versions are supported?**
A: Tested with vManage 20.x+. Should work with 19.x+ as well (uses standard `/dataservice/*` APIs).

**Q: Can I run this on a jump host?**
A: Yes. It's a single binary with no dependencies. Copy the binary + `frontend/` folder to any machine that can reach vManage.

---

## License

MIT

---

<p align="center">
  Built for network engineers who need answers, not more dashboards.
</p>
