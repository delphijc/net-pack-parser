The primary goal for Story 1.8 is to implement automatic protocol detection and classification for packets loaded from PCAP files within the browser-only mode. This feature will enable security analysts to efficiently filter and analyze network traffic based on protocol types.

The detection mechanism will primarily rely on:
- Port numbers (e.g., 80 for HTTP, 443 for HTTPS, 53 for DNS).
- The protocol field in the IP header (e.g., TCP, UDP, ICMP).
- Deep packet inspection for common protocols like HTTP and DNS to refine classification.

Each packet will be tagged with detected protocols (e.g., "TCP, HTTP", "UDP, DNS"). The UI will provide filtering capabilities by protocol and display a protocol distribution chart. Packets with uncertain detection will be labeled as "Unknown" along with their port number. This aligns with Functional Requirement FR20 from the PRD and leverages the existing `pcapParser.ts` utility for integration.