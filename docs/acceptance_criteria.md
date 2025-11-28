# Acceptance Criteria: Story 2.1 - BPF Filter Engine

## Story 2.1: BPF Filter Engine

As a security analyst,
I want to apply Berkeley Packet Filter (BPF) syntax to filter packets,
So that I can use industry-standard filtering expressions I already know.

## Acceptance Criteria

1.  **Given** packets are loaded in the application
2.  **When** I enter a BPF filter expression in the filter input (e.g., "tcp port 443")
3.  **Then** the system validates the BPF syntax
4.  **And if valid**, applies the filter and shows only matching packets
5.  **And** displays filter status: "Showing X of Y packets (filtered by: tcp port 443)"
6.  **And if invalid syntax**, shows error inline: "Invalid BPF syntax near 'port'"
7.  **And** common BPF filters work correctly:
    *   `tcp port 443` - TCP traffic on port 443
    *   `host 192.168.1.1` - Traffic to/from specific IP
    *   `src net 10.0.0.0/8` - Source from 10.x.x.x network
    *   `tcp and not port 22` - TCP except SSH
8.  **And** I can clear the filter with one click