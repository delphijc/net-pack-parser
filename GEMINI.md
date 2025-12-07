# GEMINI.md

## Project Overview

This is a network traffic analysis tool with a web-based interface and a backend server. The project is structured as a monorepo with a `client` and a `server` directory.

-   **Client:** A React application built with Vite, TypeScript, and Tailwind CSS. It provides the user interface for uploading and analyzing PCAP files. The client is responsible for rendering the data provided by the server and for all user interactions. It includes a number of UI components for displaying packet data, as well as services for interacting with the backend API and managing local data. The main UI is a dashboard with multiple tabs for different views, including an overview, packet inspector, timeline, and threat intelligence.
-   **Server:** A Node.js application built with Express and TypeScript. It handles the parsing of PCAP files and provides the results to the client via a REST API. The server is responsible for the heavy lifting of parsing the PCAP files and extracting the relevant information.

## Building and Running

### Prerequisites

-   Node.js (version 22.x or higher)
-   npm

### Installation

1.  **Install Client Dependencies:**
    ```bash
    cd client
    npm install
    ```
2.  **Install Server Dependencies:**
    ```bash
    cd ../server
    npm install
    ```

### Running the Application

The application requires both the client and server to be running.

1.  **Start the Server:**
    ```bash
    cd server
    npm run build
    npm run start
    ```
    The server will be running at `http://localhost:3000`.

2.  **Start the Client:**
    ```bash
    cd client
    npm run dev
    ```
    The client will be running at `http://localhost:5173`.

## Development Conventions

### Testing

The client-side tests can be run using the following command:

```bash
cd client
npm test
```

### Linting

Both the client and server have linting configured.

-   **Client:**
    ```bash
    cd client
    npm run lint
    ```
-   **Server:**
    ```bash
    cd server
    npm run lint
    ```

### Code Style

The project uses Prettier for code formatting. It is recommended to use a Prettier extension in your editor to automatically format the code on save.

### API

The server exposes a REST API for the client to consume. The API is defined in `server/src/routes/analysis.ts`.

-   `POST /api/upload`: Uploads a PCAP file for analysis.
-   `GET /api/analysis/:sessionId/status`: Retrieves the status of an analysis session.
-   `GET /api/analysis/:sessionId/results`: Retrieves the results of an analysis session.
