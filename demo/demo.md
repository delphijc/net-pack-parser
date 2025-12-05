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
3.  The application will parse the file and automatically navigate to the **Analysis Dashboard**.

## Step 2: Explore Packet List & Details

1.  **Packet List**: You should see a list of packets.
    *   Observe the different protocols (TCP, HTTP).
    *   Notice the **Shield Icon** on several packets, indicating detected threats.
2.  **Packet Details**: Click on the first packet (Packet #1).
    *   The **Packet Details** view will open on the right (or bottom, depending on layout).
    *   Select the **"Hex Dump"** tab to view the raw packet data.
    *   Select the **"Payload"** tab to see the ASCII representation of the HTTP request.

## Step 3: Verify Threat Detection

The `demo.pcap` file contains specific traffic patterns designed to trigger the application's threat detection engines.

### 1. SQL Injection Detection
*   **Locate**: Look for packets with the **"SQL Injection"** alert (usually red or orange shield).
*   **Verify**:
    *   Find the packet containing `GET /login?user=' OR '1'='1`.
    *   Click on it and check the **Threats** tab in the details view.
    *   You should see a **"Classic SQL Injection"** alert.
    *   Find the packet containing `UNION SELECT`.
    *   Verify the **"Union-Based SQL Injection"** alert.

### 2. IOC (Indicator of Compromise) Matching
*   **Locate**: Look for packets flagged with **"IOC Match"**.
*   **Verify**:
    *   **IP Match**: Find the packet involving `192.0.2.1`. This is a known malicious IP in the demo database.
    *   **Domain Match**: Find the packet with Host `malicious-example.com`. This triggers a domain-based IOC alert.

### 3. Other Web Attacks
*   **XSS (Cross-Site Scripting)**:
    *   Find the `POST /comment` packet containing `<script>alert(1)</script>`.
    *   Verify the **"Cross-Site Scripting (XSS)"** alert.
*   **Directory Traversal**:
    *   Find the packet requesting `/../../etc/passwd`.
    *   Verify the **"Directory Traversal"** alert.
*   **Command Injection**:
    *   Find the packet with `; ls -la`.
    *   Verify the **"Command Injection"** alert.

## Step 4: Dashboard & Analytics

1.  Navigate to the **"Dashboard"** tab (if available in the navigation menu) or check the summary metrics at the top of the analysis page.
2.  **Threat Summary**: You should see a count of "High" and "Critical" threats corresponding to the attacks in the PCAP.
3.  **Kill Chain Visualization**: If implemented, check if these threats are mapped to stages of the Cyber Kill Chain (e.g., "Exploitation", "Delivery").

## Troubleshooting

*   **No Threats Detected?**: Ensure you are using the generated `demo.pcap` from the `demo/` directory.
*   **Upload Fails?**: Check the browser console for any parsing errors. The file is a standard PCAP format.
