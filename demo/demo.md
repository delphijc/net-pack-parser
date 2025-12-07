# Network Traffic Parser - Complete Demo Guide

This guide provides comprehensive step-by-step instructions to demonstrate all 105 Functional Requirements implemented across 8 epics. Use the included `demo.pcap` file to test all features.

## Prerequisites

1. **Start the Server:**
   ```bash
   cd server
   npm run dev
   ```
   Server runs at `http://localhost:3000`

2. **Start the Client:**
   ```bash
   cd client
   npm run dev
   ```
   Client runs at `http://localhost:5173`

---

## Epic 1: Foundation & Browser-Only Infrastructure

### Demo 1.1: Project & Application Access
**FRs Covered:** FR1 (No authentication required)

1. Navigate to `http://localhost:5173`
2. ✅ Verify: Application loads without login prompt
3. ✅ Verify: All core features accessible immediately

### Demo 1.2: Local Storage Management
**FRs Covered:** FR2 (Local storage), FR5 (Usage warnings), FR6 (Clear data)

1. Navigate to **Settings** → **Storage**
2. ✅ Verify: Storage usage indicator shows current usage
3. ✅ Verify: Usage warning appears when approaching limits (>80%)
4. Click **"Clear All Local Data"**
5. ✅ Verify: Confirmation dialog appears before clearing
6. ✅ Verify: Success toast confirms data cleared

### Demo 1.3: Data Import/Export
**FRs Covered:** FR3 (Export data), FR4 (Import data)

1. Load `demo/demo.pcap` first
2. Navigate to **Settings** → **Data Management**
3. Click **"Export Data"**
4. ✅ Verify: JSON file downloads with packets, filters, notes, settings
5. ✅ Verify: Export contains `export_date`, `app_version`, `data_schema_version`
6. Clear all data (Step 1.2)
7. Click **"Import Data"** and select the exported file
8. ✅ Verify: Data restored with success notification

### Demo 1.4: PCAP File Upload & Parsing
**FRs Covered:** FR16 (Upload PCAP), FR17 (Parse and extract metadata)

1. On **Dashboard**, locate the upload zone
2. Drag and drop `demo/demo.pcap` (or use file picker)
3. ✅ Verify: Loading indicator appears during parsing
4. ✅ Verify: Success notification: "Parsed X packets from demo.pcap"
5. ✅ Verify: Packets appear in list with: timestamp, src/dst IP:port, protocol, size

### Demo 1.5: File Hash Generation & Chain of Custody
**FRs Covered:** FR18 (Hash generation), FR56-FR58 (Chain of custody)

1. After uploading `demo.pcap`:
2. ✅ Verify: **File Info** panel shows SHA-256 and MD5 hashes
3. Navigate to **Files Tab** → **Chain of Custody**
4. ✅ Verify: Log entry includes:
   - Timestamp (ISO 8601)
   - Action: "File Uploaded"
   - Filename, size, SHA-256, MD5, User Agent
5. Re-upload same file → ✅ Verify: "✓ File integrity verified" appears

### Demo 1.6: Packet Detail View with Hex Dump
**FRs Covered:** FR23 (View packet details), FR24 (Hex dump)

1. Click any packet in the list
2. ✅ Verify: Sheet slides open with:
   - Packet summary (timestamp, IPs, ports, protocol, size)
   - Decoded headers for detected protocol
3. Click **"Hex Dump"** tab
4. ✅ Verify: Format shows `OFFSET  HEX-VALUES  ASCII`
   - Example: `0000  45 00 00 3c 1c ...  E..<.`
5. ✅ Verify: Non-printable characters render as `.`
6. Test **"Copy Hex"** and **"Copy ASCII"** buttons

### Demo 1.7: Token & String Extraction
**FRs Covered:** FR19 (Extract tokens and strings)

1. Open packet details for an HTTP packet
2. Click **"Extracted Strings"** tab
3. ✅ Verify: Strings categorized as:
   - IP addresses (IPv4/IPv6)
   - URLs (http://, https://)
   - Email addresses
   - Potential credentials (username=, password=, api_key=)
   - File paths
4. ✅ Verify: Filter dropdown to show specific types
5. Click a string → ✅ Verify: Highlights in packets containing it

### Demo 1.8: Protocol Detection & Classification
**FRs Covered:** FR20 (Protocol detection)

1. View packet list column for "Protocol"
2. ✅ Verify: Packets tagged with detected protocols: HTTP, HTTPS, DNS, TCP, UDP, ICMP, FTP, SMTP, SSH
3. ✅ Verify: Protocol detection via port and deep packet inspection
4. ✅ Verify: Unknown protocols show "Unknown (port number)"
5. Navigate to **Overview** tab → ✅ Verify: Protocol distribution chart

### Demo 1.9: File Reference Detection & Download
**FRs Covered:** FR21 (Detect files), FR22 (Download files)

1. Navigate to **Files** tab
2. ✅ Verify: Detected files listed with:
   - Filename, Size, MIME type, Source IP, Timestamp
3. ✅ Verify: Detection via HTTP Content-Disposition, Content-Type, FTP commands
4. Click **"Download"** on any file
5. ✅ Verify: SHA-256 hash shown for downloaded file
6. ✅ Verify: Download logged in Chain of Custody

### Demo 1.10: Smart Packet List Views
**FRs Covered:** FR106 (Show Threats Only), FR107 (Aggregated flows)

1. Toggle **"Show Threats Only"** button
2. ✅ Verify: List filters to only threat-flagged packets
3. ✅ Verify: Preference saves to Settings
4. Switch to **"Flow View"**
5. ✅ Verify: Aggregated TCP/UDP sessions show:
   - Source/Dest IP:Port, Protocol, Start Time, Duration, Bytes/Packet Count
6. Click a flow → ✅ Verify: Expands to show constituent packets

---

## Epic 2: Search, Filter & Basic Analysis

### Demo 2.1: BPF Filter Engine
**FRs Covered:** FR25 (BPF syntax filters)

1. Locate the **Filter Bar** at top of packet list
2. Enter: `tcp port 80`
3. ✅ Verify: Filter applies, shows "Showing X of Y packets"
4. Enter: `host 192.168.1.1`
5. ✅ Verify: Shows traffic to/from that IP
6. Enter: `tcp and not port 22`
7. ✅ Verify: TCP traffic except SSH
8. Enter invalid syntax: `port oops`
9. ✅ Verify: Inline error message with syntax hint
10. Click **"Clear Filter"** → ✅ Verify: Shows all packets

### Demo 2.2: Multi-Criteria Search
**FRs Covered:** FR26-FR31 (Search by IP, port, protocol, time, payload, multiple criteria)

1. Open **"Advanced Search"** panel
2. Set criteria:
   - Source IP: `192.168.1.0/24` (CIDR notation)
   - Destination Port: `80-443` (range)
   - Protocol: `HTTP`
   - Time Range: Use date pickers
   - Payload Contains: `login`
3. Select AND/OR logic
4. Click **"Search"**
5. ✅ Verify: Results appear in <500ms
6. ✅ Verify: Matches highlighted in packet list
7. Click **"Save Search"** → Name: "Login Attempts"
8. ✅ Verify: Appears in "Saved Searches" dropdown

### Demo 2.3: Search Result Highlighting
**FRs Covered:** FR32 (Highlight search matches)

1. Perform a search for IP or string
2. Click a matching packet
3. ✅ Verify: In packet details:
   - Matched IP addresses highlighted (yellow background #FEF3C7)
   - Matched port numbers highlighted
   - Matched strings in hex dump highlighted
4. ✅ Verify: "Current Search" badge above packet list
5. Hover badge → ✅ Verify: Full search criteria in tooltip

---

## Epic 3: Threat Detection & Security Analysis

### Demo 3.1: SQL Injection Detection
**FRs Covered:** FR33 (SQL injection), FR39 (MITRE ATT&CK), FR40 (Severity), FR41 (Alerts)

1. Find packet with `GET /login?user=' OR '1'='1`
2. ✅ Verify: **Shield icon** in packet row
3. Click packet → **Threats** tab
4. ✅ Verify: Alert shows:
   - Severity: CRITICAL (red badge)
   - Type: SQL Injection
   - MITRE ATT&CK: T1190 (Exploit Public-Facing Application)
   - Pattern matched highlighted
5. Find `UNION SELECT` packet → ✅ Verify: Union-based SQLi alert

### Demo 3.2: XSS Pattern Detection
**FRs Covered:** FR34 (XSS detection)

1. Find `POST /comment` with `<script>alert(1)</script>`
2. ✅ Verify: XSS alert with:
   - Severity: HIGH (orange badge)
   - MITRE ATT&CK: T1059.007 (JavaScript)
3. ✅ Verify: Encoded patterns also detected (URL/HTML entities)

### Demo 3.3: Command Injection & Directory Traversal
**FRs Covered:** FR35 (Command injection), FR36 (Directory traversal)

1. Find packet with `; ls -la`
2. ✅ Verify: Command Injection alert (CRITICAL)
3. ✅ Verify: MITRE ATT&CK: T1059
4. Find `/../../etc/passwd`
5. ✅ Verify: Directory Traversal alert (HIGH)
6. ✅ Verify: MITRE ATT&CK: T1083

### Demo 3.4: Sensitive Data Exposure
**FRs Covered:** FR37 (Sensitive data detection)

1. Navigate to **Threats** panel
2. Find "Sensitive Data Exposure" alerts
3. ✅ Verify: Detection of:
   - Credit card numbers (Luhn validated)
   - SSNs (XXX-XX-XXXX)
   - API keys (AWS AKIA..., GitHub tokens)
   - Cleartext passwords
   - Private keys (BEGIN RSA PRIVATE KEY)
4. ✅ Verify: Sensitive data **redacted** in UI (e.g., `XXXX-XXXX-XXXX-1234`)
5. Click "Show Sensitive Data" (with confirmation)

### Demo 3.5: YARA Signature Scanning
**FRs Covered:** FR38 (YARA scans)

1. Navigate to **Threats** tab → **YARA Rules**
2. ✅ Verify: Built-in rule sets available
3. Upload custom `.yar` file or enable built-in rules
4. Trigger scan on packets
5. ✅ Verify: Matches show:
   - Rule Name, Matched Strings
   - Severity from rule metadata
   - MITRE ATT&CK mapping

### Demo 3.6: MITRE ATT&CK Framework Mapping
**FRs Covered:** FR39 (MITRE ATT&CK mapping)

1. Navigate to **Threats** → **Dashboard**
2. ✅ Verify: Each threat shows Technique ID and Name
3. Click technique ID → ✅ Verify: Link to MITRE ATT&CK website
4. ✅ Verify: ATT&CK tactics distribution chart
5. ✅ Verify: Top 10 techniques table

### Demo 3.7: Threat Intelligence IOC Database
**FRs Covered:** FR43-FR48 (IOC database, search, add, import, highlight, export)

1. Navigate to **Threats** → **IOC Database**
2. ✅ Verify: Built-in IOC database visible (IP, Domain, Hash counts)
3. Find packet matching IOC (e.g., `192.0.2.1` or `malicious-example.com`)
4. ✅ Verify: "Known IOC Match" alert with source attribution
5. Click **"Add Custom IOC"** → Add IP/Domain/Hash
6. Click **"Import IOCs"** → Upload CSV/JSON/STIX file
7. ✅ Verify: Matched packets highlighted
8. Click **"Export Matched IOCs"**

### Demo 3.8: Threat Severity & Alert Management
**FRs Covered:** FR40 (Severity levels), FR41 (Generate alerts), FR42 (Mark false positives)

1. View **Threats** panel
2. ✅ Verify: Color-coded severity badges (CRITICAL-red, HIGH-orange, MEDIUM-amber, LOW-yellow, INFO-blue)
3. Filter by severity level
4. Sort by: severity, timestamp, source IP
5. Mark a threat as **"False Positive"**
6. ✅ Verify: Moved to "False Positives" tab
7. Mark a threat as **"Confirmed"**
8. ✅ Verify: Flagged for follow-up
9. Add investigation notes

---

## Epic 4: Performance Monitoring Dashboard

### Demo 4.1-4.2: Core Web Vitals & Navigation Timing
**FRs Covered:** FR7 (Web Vitals), FR8 (Page load tracking)

1. Navigate to **Performance** tab
2. ✅ Verify: Real-time metrics displayed:
   - LCP (Largest Contentful Paint)
   - FCP (First Contentful Paint)
   - CLS (Cumulative Layout Shift)
   - FID (First Input Delay)
   - TTFB (Time to First Byte)
3. ✅ Verify: Page load time and navigation timing shown

### Demo 4.3: Long Task Detection
**FRs Covered:** FR9 (Long tasks >50ms)

1. Navigate to **Performance** → **Long Tasks**
2. ✅ Verify: Tasks exceeding 50ms listed with duration

### Demo 4.4: Resource Timing Waterfall
**FRs Covered:** FR10 (Resource timing), FR14 (Waterfall visualization)

1. Navigate to **Performance** → **Resources**
2. ✅ Verify: Network requests with timing
3. ✅ Verify: Waterfall visualization for request sequence

### Demo 4.5-4.6: Dashboard & Historical Trends
**FRs Covered:** FR11 (Real-time metrics), FR12 (Historical trends)

1. ✅ Verify: Performance dashboard with live metrics
2. Use time filters (Last Hour, Last Day, Last Week)
3. ✅ Verify: Historical trend charts update

### Demo 4.7: Performance Score
**FRs Covered:** FR13 (0-100 score)

1. ✅ Verify: Performance score gauge (0-100)
2. ✅ Verify: Score based on Core Web Vitals thresholds

### Demo 4.8: Performance Data Filtering
**FRs Covered:** FR15 (Filter by resource type/domain)

1. Filter resources by type (JS, CSS, Images, XHR)
2. Filter by domain
3. ✅ Verify: Filtered results update immediately

---

## Epic 5: Forensic Investigation & Timeline Analysis

### Demo 5.1-5.2: Chronological Timeline with Zoom/Pan
**FRs Covered:** FR49 (Timeline generation), FR50 (Zoom/pan controls)

1. Navigate to **Timeline** tab
2. ✅ Verify: Chronological packet timeline
3. Use zoom controls (scroll wheel or buttons)
4. Pan left/right to navigate
5. ✅ Verify: Smooth, responsive interaction

### Demo 5.3: Event Correlation
**FRs Covered:** FR51 (Correlate events)

1. View Timeline with correlated events
2. ✅ Verify: Related events visually connected
3. ✅ Verify: Correlation across packets shown

### Demo 5.4: Bookmarking & Annotations
**FRs Covered:** FR52 (Bookmark events), FR53 (Annotate events)

1. Click a timeline event
2. Click **"Bookmark"**
3. ✅ Verify: Bookmark icon appears on event
4. Add annotation/note
5. ✅ Verify: Note saved and visible on hover

### Demo 5.5: TCP Session Flow Identification
**FRs Covered:** FR54 (Conversation flows)

1. View Timeline or enable **Flow View**
2. ✅ Verify: TCP sessions grouped
3. ✅ Verify: HTTP request/response pairs linked

### Demo 5.6: Timeline Filtering
**FRs Covered:** FR55 (Filter by threat/protocol)

1. Use Timeline filters:
   - Filter by protocol (HTTP, DNS, etc.)
   - Filter by threat level (HIGH, CRITICAL)
2. ✅ Verify: Timeline updates to show only filtered events

### Demo 5.7-5.8: Chain of Custody & Evidence Export
**FRs Covered:** FR56-FR60 (Chain of custody, timestamps, integrity, export)

1. Navigate to **Chain of Custody** log
2. ✅ Verify: All analysis actions timestamped
3. ✅ Verify: File integrity verified via hash comparison
4. Click **"Export Evidence Package"**
5. ✅ Verify: Package includes metadata, hashes, logs

### Demo 5.9: Forensic Report Generation
**FRs Covered:** FR61 (Structured reports)

1. Navigate to **Reports** → **Generate Forensic Report**
2. ✅ Verify: Structured report with findings
3. ✅ Verify: Includes evidence chain, hashes, timeline

### Demo 5.10: Case Notes & Comments
**FRs Covered:** FR62 (Case notes)

1. Add case notes via **Notes** section
2. ✅ Verify: Notes stored with timestamps
3. ✅ Verify: Notes included in exports and reports

---

## Epic 6: Visualization, Reporting & Export

### Demo 6.1-6.3: Protocol, Traffic & Top Talkers Charts
**FRs Covered:** FR63 (Protocol distribution), FR64 (Traffic volume), FR65 (Top talkers)

1. Navigate to **Overview** or **Analytics** tab
2. ✅ Verify: Protocol distribution pie/bar chart
3. ✅ Verify: Traffic volume over time line graph
4. ✅ Verify: Top talkers (most active IPs) table

### Demo 6.4: Geographic IP Distribution
**FRs Covered:** FR66 (Geo distribution)

1. Navigate to **Analytics** → **Geographic View**
2. ✅ Verify: World map with IP locations plotted
3. Hover/click markers for details

### Demo 6.5: Chart Export
**FRs Covered:** FR67 (Export charts as images)

1. Hover over any chart
2. Click **"Export"** → Select PNG or SVG
3. ✅ Verify: Image downloads correctly

### Demo 6.6-6.7: Summary Reports & Custom Builder
**FRs Covered:** FR68 (Summary reports), FR69 (Customize sections)

1. Navigate to **Reports** → **Generate Summary Report**
2. ✅ Verify: Report with key findings
3. Click **"Customize Report"**
4. ✅ Verify: Select/deselect sections and data

### Demo 6.8-6.9: CSV & JSON Export
**FRs Covered:** FR70 (CSV export), FR71 (JSON export), FR75 (Integrity hashes)

1. Navigate to **Export** menu
2. Click **"Export as CSV"**
3. ✅ Verify: CSV file with packet/threat data
4. Click **"Export as JSON"**
5. ✅ Verify: JSON with schema version
6. ✅ Verify: Both include integrity hashes

### Demo 6.10-6.12: Filtered & Specialized Exports
**FRs Covered:** FR72 (Filtered export), FR73 (Performance export), FR74 (Threat export)

1. Apply a filter or search
2. Click **"Export Filtered Results"**
3. ✅ Verify: Only filtered data exported
4. Navigate to **Performance** → **Export**
5. ✅ Verify: Performance data with timestamps
6. Navigate to **Threats** → **Export Evidence**
7. ✅ Verify: Threat data with integrity hashes

---

## Epic 7: Server-Side Capture Agent

### Demo 7.1-7.9: Capture Setup & Control
**FRs Covered:** FR84-FR93 (Interface enumeration, capture control, BPF, pause/resume, stats, buffer, export, API)

1. Ensure server is running on `http://localhost:3000`
2. Navigate to **Live Capture** tab
3. ✅ Verify: **Network interfaces** listed from agent
4. Select an interface
5. Configure **BPF filter** before capture
6. Click **"Start Capture"**
7. ✅ Verify: Live packets streaming
8. ✅ Verify: Capture statistics updating (packets, bytes, rate)
9. Click **"Pause"** / **"Resume"**
10. ✅ Verify: Capture pauses and resumes correctly
11. ✅ Verify: Buffer limit warnings if approaching limits
12. Click **"Stop Capture"**
13. Click **"Export PCAP"** → ✅ Verify: File downloads

### Demo 7.10-7.15: Authentication & Connection Management
**FRs Covered:** FR76-FR83 (Auth, JWT, multi-agent, status, auto-reconnect, profiles, compatibility)

1. Navigate to **Connections** → **Add Agent**
2. Enter credentials (username/password or API key)
3. ✅ Verify: JWT token generated and managed
4. ✅ Verify: Agent compatibility/version checked
5. Add multiple capture agents
6. ✅ Verify: Connection status for each agent displayed
7. Disconnect network briefly → ✅ Verify: Auto-reconnect activates
8. Save connection as "Work Lab" profile
9. ✅ Verify: Profile saved and reusable

### Demo 7.16-7.19: Session Management
**FRs Covered:** FR101-FR105 (Session list, download, delete, metadata)

1. Navigate to **Capture Sessions**
2. ✅ Verify: List of stored sessions with metadata
3. ✅ Verify: Metadata includes: start/end time, packet count, size
4. Click **"Download"** → ✅ Verify: PCAP file downloads
5. Click **"Load for Analysis"** → ✅ Verify: Session loads in browser
6. Click **"Delete"** → ✅ Verify: Session removed with confirmation

---

## Epic 8: Real-Time Streaming & Live Analysis

### Demo 8.1-8.4: WebSocket Streaming & Live Display
**FRs Covered:** FR94 (WebSocket stream), FR95 (Real-time display)

1. Start a live capture (Epic 7)
2. ✅ Verify: WebSocket connection established (WSS/TLS)
3. ✅ Verify: Packets appear in real-time as captured
4. ✅ Verify: Virtual scrolling handles high packet rates

### Demo 8.5-8.7: Live Threat Detection, Alerts & Timeline
**FRs Covered:** FR96 (Live threat detection), FR97 (Real-time alerts), FR98 (Live timeline)

1. During live capture, inject malicious traffic (or use crafted packets)
2. ✅ Verify: Threats detected in real-time
3. ✅ Verify: Toast notification appears for HIGH/CRITICAL threats
4. ✅ Verify: Alert sound plays (if enabled)
5. Navigate to **Timeline** → ✅ Verify: Live updates with new packets

### Demo 8.8: Stream Filtering
**FRs Covered:** FR99 (Filter live stream)

1. During live capture, apply a filter (e.g., `tcp port 80`)
2. ✅ Verify: Only matching packets displayed
3. ✅ Verify: Filter applies without stopping capture

### Demo 8.9-8.10: Latency Monitoring & Reconnection
**FRs Covered:** FR100 (Latency/packet loss), Stream recovery

1. View **Stream Status** indicator
2. ✅ Verify: Latency and packet loss displayed
3. Simulate network interruption
4. ✅ Verify: Reconnection with state recovery
5. ✅ Verify: No duplicate packets after reconnect

---

## Quick Verification Checklist

| Epic | FRs Covered | Status |
|------|-------------|--------|
| 1: Foundation | FR1-FR6, FR16-FR24, FR106-FR107 | ✅ |
| 2: Search & Filter | FR25-FR32 | ✅ |
| 3: Threat Detection | FR33-FR48 | ✅ |
| 4: Performance | FR7-FR15 | ✅ |
| 5: Forensics | FR49-FR62 | ✅ |
| 6: Visualization | FR63-FR75 | ✅ |
| 7: Capture Agent | FR76-FR93, FR101-FR105 | ✅ |
| 8: Live Streaming | FR94-FR100 | ✅ |

**Total: 105 Functional Requirements Covered**

---

## Notes

- Demo PCAP file located at: `demo/demo.pcap`
- For live capture demos, ensure sufficient network activity
- IOC matches require traffic to known malicious indicators in the sample
- Performance metrics require user interaction to generate data
