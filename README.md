# Network Traffic Parser

A comprehensive web application and CLI toolkit for monitoring network performance and analyzing network traffic data. Built with React, TypeScript, and Tailwind CSS, this tool helps developers monitor application performance in real-time and analyze static PCAP files for deeper insights.

## 📺 Demo Video

See the Network Traffic Parser in action, from uploading a PCAP file to identifying SQL injection threats and analyzing packet details.

![NetPack Parser Demo](demo/demo_video.webp)

"You want the truth? NetPackParser **can** handle the truth."

"Know thy enemy with NetPackParser Threat and Forensics Analysis."

"PCAP because NetPackParser knows what happened."


## 🏗️ Project Architecture

This project follows a **hybrid client-server architecture** designed to support two modes of operation:

1.  **Local Analysis (Client-Server)**: A web interface paired with a local Node.js server to handle PCAP file parsing. The server is **required** for parsing operations.
2.  **Connected Mode**: (Planned) Extends the local server to act as a capture agent, streaming real-time network traffic from the host OS to the browser.

### Directory Structure

```
net-pack-parser/
├── client/              # Browser UI (Vite + React + TypeScript)
├── server/              # Backend PCAP Processing Server (Node.js + Express)
└── package.json         # Root configuration
```

---

## 🚀 Getting Started

### Prerequisites

-   **Node.js** (version 22.x LTS recommended)
-   **npm** (comes with Node.js)
-   **Git**

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/network-traffic-parser.git
    cd network-traffic-parser
    ```

2.  **Install Client Dependencies**
    ```bash
    cd client
    npm install
    ```

3.  **Install Server Dependencies**
    ```bash
    cd ../server
    npm install
    ```

### 💻 Running the Application

This application requires both the **Server** (for parsing) and the **Client** (for the UI) to be running.

**1. Start the Server**
Open a terminal:
```bash
cd server
npm run build
npm run start
```
*Server runs on http://localhost:3000*

**2. Start the Client**
Open a second terminal:
```bash
cd client
npm run dev
```
*Client runs on http://localhost:5173*

**3. Use the App**
Open your browser and navigate to `http://localhost:5173`. Uploading a PCAP file will now send it to the local server for processing.

### 🔐 Authentication (Remote/Live Capture)

Remote Capture and Live Capture features require authentication. Default credentials:

| Setting | Default | Environment Variable |
|---------|---------|---------------------|
| Username | `admin` | `ADMIN_USER` |
| Password | `password` | `ADMIN_PASS` |
| JWT Secret | `dev-secret-key-change-in-prod` | `JWT_SECRET` |

**For Production:** Set environment variables before starting the server:
```bash
export ADMIN_USER="your_username"
export ADMIN_PASS="your_secure_password"
export JWT_SECRET="your-random-secret-key"
npm run start
```

### 🧪 Testing

The project includes Unit Tests (Vitest).

#### Unit Tests (Client)
Run unit tests for the frontend components and logic:

```bash
cd client
npm test
```

To run in watch mode:
```bash
cd client
npm run test:watch
```

### 📦 Building for Production

To build the client application for production deployment:

1.  Navigate to the client directory:
    ```bash
    cd client
    ```

2.  Run the build command:
    ```bash
    npm run build
    ```

3.  (Optional) Preview the production build locally:
    ```bash
    npm run preview
    ```

The build artifacts will be generated in the `client/dist` directory, ready for static hosting.

---

## 🚀 Key Features

### Network Traffic Analysis
-   **PCAP File Support**: Upload and parse `.pcap` and `.pcapng` files directly in the browser.
-   **Packet Inspection**: Detailed view of packet headers, payloads, and hex dumps.
-   **Protocol Detection**: Automatic classification of common protocols (HTTP, HTTPS, DNS, FTP, SSH, etc.) based on port heuristics, IP header fields, and basic deep packet inspection.
-   **File Extraction**: Detect and extract files referenced in network streams.
-   **Forensic Analysis**: Identify suspicious indicators and threat patterns.

### Real-Time Performance Monitoring
-   **Core Web Vitals**: Track LCP, FCP, and CLS in real-time.
-   **Resource Timing**: Analyze waterfall charts of network requests.
-   **Long Task Detection**: Identify main-thread blocking tasks.

### Data Management
-   **Local Storage**: All analysis data is stored securely in your browser's `localStorage` and `IndexedDB`.
-   **Privacy First**: In Browser-Only mode, no data ever leaves your device.
-   **Export**: Export analysis results and extracted files.

---

## 🔧 Technical Details

-   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
-   **State Management**: TanStack Query (Server State), Zustand (UI State)
-   **Parsing**: Node.js backend for PCAP processing (server-side)
-   **Testing**: Vitest, React Testing Library

---

## 📄 License

This project is dual‑licensed under **MIT** and **Apache 2.0**.
