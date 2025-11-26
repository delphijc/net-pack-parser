# Network Traffic Parser

A comprehensive web application and CLI toolkit for monitoring network performance and analyzing network traffic data. Built with React, TypeScript, and Tailwind CSS, this tool helps developers monitor application performance in real-time and analyze static PCAP files for deeper insights.

## 🏗️ Project Architecture

This project follows a **hybrid client-server architecture** designed to support two modes of operation:

1.  **Browser-Only Mode (Client)**: A privacy-first, standalone web application that processes PCAP files and analyzes network traffic entirely within the browser. No data is sent to any server.
2.  **Connected Mode (Server)**: (In Development) A Node.js capture agent that streams real-time network traffic from the host OS to the browser via WebSockets.

### Directory Structure

```
net-pack-parser/
├── client/              # Browser UI (Vite + React + TypeScript)
│   ├── src/             # Source code
│   └── package.json     # Client dependencies
├── server/              # (Planned) Capture Agent
├── tests/               # End-to-End Tests (Playwright)
└── package.json         # Root configuration & E2E dependencies
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

2.  **Install Root Dependencies (for E2E testing)**
    ```bash
    npm install
    ```

3.  **Install Client Dependencies**
    ```bash
    cd client
    npm install
    ```

### 💻 Running in Development Mode

To start the **Browser-Only** application:

1.  Navigate to the client directory:
    ```bash
    cd client
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

3.  Open your browser and navigate to `http://localhost:5173`.

### 🧪 Testing

The project includes both Unit Tests (Vitest) and End-to-End Tests (Playwright).

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

#### End-to-End Tests
Run full system tests using Playwright from the **root** directory:

```bash
# Ensure the dev server is running (or let Playwright start it if configured)
npm run test:e2e
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
-   **Protocol Detection**: Automatic classification of HTTP, TCP, UDP, and more.
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
-   **Parsing**: `pcap-decoder` for browser-based PCAP processing
-   **Testing**: Vitest, React Testing Library, Playwright

---

## 📄 License

This project is dual‑licensed under **MIT** and **Apache 2.0**.
