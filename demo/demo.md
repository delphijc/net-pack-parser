# Network Traffic Parser - Demo Guide

This guide provides step-by-step instructions on how to use the generated `demo.pcap` file to test and demonstrate the capabilities of the Network Traffic Parser application.

## Prerequisites

1.  Ensure the application is running:
    ```bash
    cd client
    npm run dev
    ```
2.  Open your browser and navigate to `http://localhost:5173`.

## Step 1: Load the Demo PCAP File

1.  On the home page, locate the **"Upload PCAP File"** area.
2.  Click on the upload area or drag and drop the `demo/demo.pcap` file (located in the project root) into the box.
3.  **File Hashing**: Note the file information displayed, including SHA-256 and MD5 hashes (Feature: *File Hash Generation*).
4.  The application will parse the file and automatically navigate to the **Analysis Dashboard**.

## Step 2: Packet List, Filtering & Search

1.  **Packet List**: Observe the list of parsed packets with visible protocols (TCP, HTTP) and **Shield Icons** for detected threats.
2.  **BPF Filter Engine** (Feature: *Story 2.1*):
    *   Locate the Filter Bar at the top.
    *   Enter a standard BPF expression: `tcp port 80` or `http`.
    *   Press Enter or "Apply". Verify the list updates to show only matching packets.
    *   Click **"Clear Filter"** to reset.
3.  **Multi-Criteria Search** (Feature: *Story 2.2*):
    *   Open the **"Advanced Search"** panel (collapsible or side panel).
    *   Set **Protocol** to `HTTP`.
    *   Set **Payload Contains** to `login`.
    *   Click **"Search"**. Verify matches are highlighted in the list (yellow background).
    *   **Save Search**: Click "Save Search", name it "Login Attempts", and verify it appears in "Saved Searches".

## Step 3: Deep Packet Inspection

Click on any HTTP packet (e.g., Packet #1) to open the **Packet Details** view.

1.  **Hex Dump**: Click the **"Hex Dump"** tab to view raw data.
2.  **Extracted Strings** (Feature: *Story 1.7*):
    *   Click the **"Extracted Strings"** tab.
    *   View automatically extracted URLs, Emails, and potential credentials.
    *   **Filter**: Use the internal filter to show only "URL" types.
    *   **Highlighting**: Click any string in the list; verify it highlights the corresponding bytes in the Hex Dump/ASCII view (if implemented).
3.  **Files** (Feature: *Story 1.9*):
    *   Click the **"Files"** tab.
    *   If the packet contains a file transfer (HTTP/FTP), you will see file details (Name, Size, MIME Type).
    *   **Download**: Click the "Download" button to save the file locally.
    *   **Hash Verification**: Note the SHA-256 hash displayed for integrity verification.

## Step 4: Threat Detection

The `demo.pcap` file contains specific traffic patterns designed to trigger the application's threat detection engines.

### 1. SQL Injection Detection
*   **Locate**: Look for packets with the **"SQL Injection"** alert.
*   **Verify**:
    *   Find the packet containing `GET /login?user=' OR '1'='1`.
    *   Check the **Threats** tab in details view for a **"Classic SQL Injection"** alert.
    *   Find the packet containing `UNION SELECT`.
    *   Verify the **"Union-Based SQL Injection"** alert.

### 2. IOC (Indicator of Compromise) Matching
*   **Locate**: Look for packets flagged with **"IOC Match"**.
*   **Verify**:
    *   **IP Match**: Find packet with `192.0.2.1`.
    *   **Domain Match**: Find packet with Host `malicious-example.com`.

### 3. Other Web Attacks
*   **XSS**: Find `POST /comment` with `<script>alert(1)</script>`. Verify **"Cross-Site Scripting (XSS)"** alert.
*   **Directory Traversal**: Find `/../../etc/passwd`. Verify **"Directory Traversal"** alert.
*   **Cmd Injection**: Find `; ls -la`. Verify **"Command Injection"** alert.

### 4. Sensitive Data Exposure (Feature: *Story 3.4*)
*   **Locate**: Check for alerts of type **"Sensitive Data Exposure"**.
*   **Verify**:
    *   The sensitive data (e.g., Credit Card pattern) should be **redacted** in the UI description (e.g., `XXXX-XXXX-XXXX-1234`).
    *   **Toggle**: Click "Show Sensitive Data" (if available) to reveal the raw value.

## Step 5: Dashboard & Analytics

1.  Navigate to the **"Dashboard"** tab.
2.  **Threat Summary**: View counts of "High" and "Critical" threats.
3.  **Protocol Distribution**: Inspect the charts showing traffic breakdown.

## Step 6: Forensics & Master Data Management

### Chain of Custody (Feature: *Story 1.5*)
1.  Navigate to the **Upload/Home** page or look for the **"Chain of Custody"** log section.
2.  Verify entries for:
    *   **"File Uploaded"**: Timestamped entry for `demo.pcap` with hashes.
    *   **"File Downloaded"**: If you downloaded a file in Step 3, a corresponding entry should verify the action.

### Data Import/Export (Feature: *Story 1.3*)
1.  Navigate to **"Settings"**.
2.  **Export**: Click **"Export Data"**.
    *   A JSON file containing all packets, setting, and logs will download.
3.  **Clear Data**: In "Local Storage" section, click **"Clear All Local Data"**. Confirm the dashboard is empty.
4.  **Import**: Click **"Import Data"** and select the JSON file you just exported.
    *   Verify the application state (packets, threats) is restored.
