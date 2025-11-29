# QWEN.md - Project Context for Qwen

This document provides a comprehensive overview of the "Network Traffic Parser" project to be used as instructional context for Qwen.

## Project Overview

The Network Traffic Parser is a comprehensive web application for network performance monitoring and traffic analysis. It is built with a modern frontend stack and is designed to operate in two modes:

1.  **Browser-Only Mode:** For analyzing PCAP files directly in the browser with all processing done on the client-side. This is the primary mode for the current implementation.
2.  **Connected Mode:** (Planned) Involves a server-side agent for real-time packet capture, streaming data to the browser via WebSockets.

The project is structured as a monorepo, with the main frontend application located in the `client` directory.

### Key Technologies

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS
-   **Component Library:** shadcn/ui
-   **State Management:** TanStack Query (for server state) and Zustand (for UI state)
-   **Testing:** Vitest (unit), React Testing Library (component)
-   **Packet Parsing:** `pcap-decoder` library for in-browser parsing.

## Development Environment Setup

The primary application is within the `client` directory.

### Prerequisites

-   Node.js (version specified in `.nvmrc`)
-   npm

### Installation

To set up the development environment, first install the dependencies in the `client` directory:

```bash
cd client
npm install
```

### Running the Application

To start the development server for the frontend application:

```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`.

## Building and Running

### Development

-   **Run dev server:** `cd client && npm run dev`
-   **Run linters:** `cd client && npm run lint`
-   **Run unit tests:** `cd client && npm run test`

### Production

-   **Build the application:** `cd client && npm run build`
-   **Preview the production build:** `cd client && npm run preview`

## Codebase Structure

The project aims for a monorepo structure, but the primary focus for now is the `client` directory.

```
/
├── client/              # Main frontend application (Vite + React + TS)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API clients and services
│   │   ├── utils/       # Utility functions (e.g., packet parsing)
│   │   ├── types/       # TypeScript types
│   │   ├── App.tsx      # Root component
│   │   └── main.tsx     # Application entry point
│   ├── package.json     # Client dependencies and scripts
│   └── vite.config.ts   # Vite configuration
│
├── src/                 # Older/alternative root application source
├── docs/                # Project documentation (architecture, PRD)
├── package.json         # Root package.json
└── README.md
```

## Development Conventions

-   **Styling:** Utility-first classes with Tailwind CSS.
-   **Components:** Reusable components are located in `client/src/components`. `shadcn/ui` is used for the base component library.
-   **State Management:**
    -   Use **Zustand** for managing local UI state.
    -   Use **TanStack Query** for managing asynchronous operations and server state.
-   **Testing:**
    -   Unit tests are co-located with the source files (`*.test.tsx`).
-   **Linting:** ESLint is used for code quality. Run `npm run lint` in the `client` directory to check for issues.
-   **Imports:** Use absolute imports with the `@/` alias for the `client/src` directory.
