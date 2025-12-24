# Story 9.1: Distributed Lightweight Packet Capture Agent with Elasticsearch Pooling

**Story ID:** 9.1  
**Epic:** 9 (Advanced Network Infrastructure)  
**Status:** Planning  

## User Story

As a network administrator,  
I want to deploy lightweight packet capture agents across distributed hosts on my network,  
So that I can capture packets from multiple network segments, route them to a central Live Capture Page, and eventually pool all captured packets into correlated Elasticsearch indices for unified analysis.

## Functional Requirements (FRs)

### FR-1: Lightweight Capture Agent Architecture
- **FR-1.1**: Design and implement a lightweight packet capture agent that:
  - Can be deployed on distributed hosts across the network
  - Has minimal resource footprint (CPU, memory, disk)
  - Supports multiple operating systems (Linux, Windows, macOS)
  - Uses libpcap/WinPcap for packet capture
  - Can operate independently of the main server

- **FR-1.2**: Agent must support:
  - Network interface selection
  - BPF filter configuration for targeted capture
  - Configurable buffer management
  - Local packet queueing before transmission
  - Graceful degradation when network connectivity is lost

### FR-2: Remote Capture Connection (Phase 1 - Single Agent)
- **FR-2.1**: Implement "Remote Capture" connection page that:
  - Allows connection to a single remote capture agent at a time
  - Supports both IP address and hostname-based connections
  - Provides authentication mechanism (JWT or API key)
  - Displays agent status, version, and capabilities
  - Shows available network interfaces on the remote host

- **FR-2.2**: Establish secure communication channel:
  - WebSocket (WSS) or gRPC for real-time packet streaming
  - TLS encryption for all agent-to-server communication
  - Heartbeat/keepalive mechanism to detect connection issues
  - Automatic reconnection logic with exponential backoff

### FR-3: Live Capture Page Integration (Phase 1)
- **FR-3.1**: Route captured packets from remote agent to Live Capture Page:
  - Real-time packet display in the Live Capture UI
  - Support for pause/resume/stop capture from browser
  - Packet count and bandwidth statistics
  - Filter packets by BPF before transmission to reduce bandwidth

- **FR-3.2**: Session management:
  - Create session ID for each remote capture
  - Store session metadata (agent ID, start time, interface, filters)
  - Support export of captured packets as PCAP files
  - Enable "Analyze Session" to ingest packets into Elasticsearch

### FR-4: Multi-Agent Registration System (Phase 2)
- **FR-4.1**: Implement agent registration service:
  - Agent discovery and registration endpoint
  - Store agent metadata (hostname, IP, capabilities, OS, version)
  - Agent heartbeat monitoring for health tracking
  - Agent deregistration and cleanup

- **FR-4.2**: Create "Agents" management page in UI:
  - List all registered agents with status (online/offline)
  - View agent details (hostname, IP, OS, version, interfaces)
  - Configure agent-specific settings (filters, buffer sizes)
  - Enable/disable individual agents
  - Test connectivity to agents

### FR-5: Correlated Elasticsearch Pooling (Phase 2)
- **FR-5.1**: Multi-agent packet ingestion:
  - Ingest packets from multiple agents simultaneously
  - Maintain agent source metadata in Elasticsearch documents
  - Timestamp normalization across agents (NTP sync required)
  - Deduplication logic for packets seen by multiple agents

- **FR-5.2**: Elasticsearch schema enhancements:
  - Add `agent_id`, `agent_hostname`, `agent_ip` fields to packet documents
  - Create correlation indices for multi-agent sessions
  - Support querying by agent source
  - Enable filtering and visualization by capture source

- **FR-5.3**: Correlation engine:
  - Correlate packets across multiple agents by:
    - Timestamp (with clock skew tolerance)
    - Flow identifiers (5-tuple: src/dst IP/port, protocol)
    - Sequence numbers (for TCP)
  - Detect the same connection seen from different network perspectives
  - Build unified conversation views from multi-agent captures

### FR-6: Agent-to-Server Data Transfer
- **FR-6.1**: Efficient packet transmission:
  - Batch packets for efficient network utilization
  - Compression (gzip, zstd) for packet payloads
  - Flow control to prevent overwhelming the server
  - Prioritization for high-severity packets (if threat detection on agent)

- **FR-6.2**: Resilience and reliability:
  - Packet buffering on agent during network interruptions
  - Guaranteed delivery with acknowledgments
  - Retry logic with configurable limits
  - Overflow handling (drop oldest packets or alert)

### FR-7: Deployment and Configuration
- **FR-7.1**: Agent deployment packages:
  - Standalone executables for Windows, Linux, macOS
  - Docker container image for containerized deployments
  - systemd/Windows Service integration for auto-start
  - Configuration file support (YAML/JSON) for agent settings

- **FR-7.2**: Central configuration management:
  - Push configuration updates from server to agents
  - Update agent filters without restart
  - Remote upgrade capability for agent software

## Non-Functional Requirements (NFRs)

### NFR-P1: Performance
- **NFR-P1.1**: Agent must capture packets at line rate up to 1 Gbps on a single interface
- **NFR-P1.2**: Agent CPU usage should not exceed 5% during idle, 30% during active capture
- **NFR-P1.3**: Agent memory footprint should be < 100 MB baseline, < 500 MB during active capture
- **NFR-P1.4**: Server must support ingestion from at least 10 concurrent agents
- **NFR-P1.5**: End-to-end packet latency from agent capture to server receipt: < 100ms (95th percentile)
- **NFR-P1.6**: Elasticsearch indexing for multi-agent pooled data: < 5 seconds for 10,000 packets across 5 agents

### NFR-S1: Scalability
- **NFR-S1.1**: System must support minimum 50 registered agents
- **NFR-S1.2**: System must support minimum 10 simultaneous active capture sessions
- **NFR-S1.3**: Agent should handle interface speeds up to 10 Gbps with appropriate hardware
- **NFR-S1.4**: Elasticsearch cluster must scale horizontally to handle increased agent count

### NFR-R1: Reliability
- **NFR-R1.1**: Agent uptime: 99.9% (with auto-restart on crash)
- **NFR-R1.2**: Agent must recover from network interruptions within 30 seconds
- **NFR-R1.3**: Packet data integrity: < 0.01% packet loss during transmission (under normal network conditions)
- **NFR-R1.4**: Agent must log all errors to local log file for debugging

### NFR-SEC1: Security
- **NFR-SEC1.1**: All agent-to-server communication must use TLS 1.3
- **NFR-SEC1.2**: Agent authentication via JWT tokens or certificate-based authentication
- **NFR-SEC1.3**: Token/certificate rotation every 90 days
- **NFR-SEC1.4**: Agent should support firewall configuration (only outbound connections to server)
- **NFR-SEC1.5**: Captured packet data must be encrypted during transit
- **NFR-SEC1.6**: Access control: only authorized users can view packets from specific agents

### NFR-M1: Maintainability
- **NFR-M1.1**: Agent must expose health check endpoint for monitoring
- **NFR-M1.2**: Agent must expose metrics endpoint (Prometheus format) for observability
- **NFR-M1.3**: Detailed logging with configurable log levels (ERROR, WARN, INFO, DEBUG)
- **NFR-M1.4**: Remote diagnostics capability (query agent state without SSH)
- **NFR-M1.5**: Automated agent version checking and update notifications

### NFR-O1: Operational
- **NFR-O1.1**: Agent installation should complete in < 5 minutes
- **NFR-O1.2**: Agent should auto-detect optimal network interfaces
- **NFR-O1.3**: Agent configuration changes should apply without restart when possible
- **NFR-O1.4**: Server dashboard should show agent topology visualization

### NFR-C1: Compatibility
- **NFR-C1.1**: Agent must support Linux kernel 4.0+, Windows 10+, macOS 10.15+
- **NFR-C1.2**: Agent must work with existing Live Capture page without UI refactoring
- **NFR-C1.3**: Backward compatibility: agent protocol versioning to support rolling upgrades
- **NFR-C1.4**: Elasticsearch version compatibility: 7.x and 8.x

## Design & Implementation Considerations

### Component Structure

#### Phase 1: Single Agent Remote Capture
1. **Lightweight Capture Agent** (New standalone application)
   - Language: Go or Rust (for performance, cross-platform compilation)
   - Libraries: gopacket/libpcap (Go) or pcap-rs (Rust)
   - Communication: WebSocket client to server

2. **Server-Side Agent Manager** (New service)
   - `server/src/services/agentManager.ts`: Agent connection handling
   - `server/src/routes/agents.ts`: API endpoints for agent management
   - WebSocket server for agent connections

3. **Client-Side Remote Capture Page** (Enhance existing)
   - `client/src/pages/RemoteCapture.tsx`: Connection management UI
   - `client/src/services/agentService.ts`: API client for agent operations

#### Phase 2: Multi-Agent with Elasticsearch Pooling
4. **Agent Registry** (New database)
   - SQLite or PostgreSQL table for agent metadata
   - Schema: `agents` table with id, hostname, ip, status, last_heartbeat, version, etc.

5. **Elasticsearch Schema Extensions**
   - New fields in packet index mapping
   - Correlation indices for multi-agent sessions

6. **Correlation Engine** (New service)
   - `server/src/services/correlationEngine.ts`: Cross-agent packet correlation
   - Flow reconstruction from multi-perspective captures

7. **Agents Management UI** (New page)
   - `client/src/pages/AgentsManager.tsx`: Agent list, status, configuration
   - `client/src/components/AgentTopology.tsx`: Visual topology map

### Data Flow

```
[Agent Host 1..N] --WSS--> [Agent Manager] ---> [Elasticsearch] ---> [Correlation Engine] ---> [Live Capture Page UI]
```

### Technology Stack Considerations
- **Agent Language**: Go (preferred for deployment simplicity) or Rust (for performance)
- **Communication Protocol**: WebSocket (already implemented) or gRPC (better for structured data)
- **Serialization**: Protocol Buffers (efficient) or JSON (easier debugging)
- **Agent Discovery**: mDNS/Bonjour, manual registration, or cloud-based service discovery

## Dependencies

- **Depends on existing stories**:
  - Story 7.x: Server-Side Capture Agent (foundation for remote agent design)
  - Story 8.x: Real-Time Streaming (WebSocket infrastructure)
  - Story 3.7: Threat Intelligence IOC Database (for agent metadata storage pattern)

- **External dependencies**:
  - NTP/Chrony for time synchronization across agents
  - TLS certificates for secure communication
  - Elasticsearch cluster capacity planning

## Open Questions for User Review

1. **Agent Language Choice**: Preference for Go (easier deployment, single binary) vs. Rust (higher performance, steeper learning curve)?

2. **Communication Protocol**: WebSocket (already in use) vs. gRPC (better performance, type safety)?

3. **Agent Deployment Model**: 
   - Pull-based (agents register to server)?
   - Push-based (server discovers agents on network)?
   - Hybrid?

4. **Packet Storage Strategy**:
   - Store all packets from all agents (high storage cost)?
   - Selective storage based on filters/threats?
   - Time-based retention policies per agent?

5. **Time Synchronization**:
   - Require NTP on all agent hosts?
   - Implement server-side clock skew correction?

6. **Agent Authentication**:
   - JWT tokens?
   - mTLS with client certificates?
   - API keys?

7. **Phase 1 vs Phase 2 Scope**:
   - Should we implement both phases serially, or is Phase 1 sufficient for initial deployment?

## Testing Strategy

### Unit Testing
- Agent packet capture and queueing logic
- Server-side agent connection management
- Elasticsearch multi-agent query logic

### Integration Testing
- Agent-to-server packet streaming
- Multi-agent simultaneous capture
- Correlation engine with packet from different agents
- Elasticsearch indexing with agent metadata

### Performance Testing
- Agent resource usage under load (1 Gbps capture)
- Server handling 10 concurrent agents
- Elasticsearch query performance with multi-agent data

### Security Testing
- TLS encryption verification
- Authentication bypass attempts
- Agent impersonation scenarios

## Rollout Plan

### Phase 1: Single Remote Agent (MVP)
1. Develop lightweight capture agent (4 weeks)
2. Implement server-side agent manager (2 weeks)
3. Create Remote Capture connection page (2 weeks)
4. Integration testing (1 week)
5. Documentation and deployment guides (1 week)

**Total Phase 1**: ~10 weeks

### Phase 2: Multi-Agent Pooling
1. Implement agent registration system (2 weeks)
2. Extend Elasticsearch schema (1 week)
3. Build correlation engine (3 weeks)
4. Create Agents management UI (2 weeks)
5. Load testing and optimization (2 weeks)
6. Documentation (1 week)

**Total Phase 2**: ~11 weeks

## References

- [Existing Story 7.1: Capture Agent Project Setup](7-1-capture-agent-project-setup-nodejs-python-libpcap-bindings.md)
- [Existing Story 8.1: WebSocket Server Setup](8-1-websocket-server-setup-wss-with-tls.md)

## Notes

- This story represents a **PLANNING DOCUMENT ONLY** - no implementation has occurred
- Requires architectural review before development begins
- May impact existing Live Capture functionality - regression testing required
- Consider developing a proof-of-concept for agent-to-server communication before full implementation
