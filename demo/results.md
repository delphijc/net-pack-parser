# Network Traffic Parser - Demo Creation Walkthrough

## Objective
Created a demo directory with a demonstration PCAP file and guide for testing the Network Traffic Parser application.

## What Was Accomplished

### 1. Created Demo Directory Structure
- **Location**: `/Users/delphijc/Projects/net-pack-parser/demo/`
- **Files**:
  - `demo.pcap` - PCAP file with various attack patterns
  - `demo.md` - Step-by-step testing guide  
  - `generate_pcap.js` - Script to regenerate the PCAP

### 2. Generated Demo PCAP File

The `demo.pcap` file contains 8 packets demonstrating various features:

1. **Normal HTTP Traffic** (2 packets)
   - GET request and 200 OK response
   - Tests basic packet parsing and display

2. **SQL Injection Attacks** (2 packets)
   - Classic: `' OR '1'='1`
   - Union-based: `UNION SELECT * FROM users`
   - Tests SQL injection detection

3. **IOC Matches** (2 packets)
   - Malicious IP: `192.0.2.1` (in IOC database)
   - Malicious domain: `malicious-example.com` (in IOC database)
   - Tests IOC detection and alerting

4. **Cross-Site Scripting (XSS)** (1 packet)
   - Payload: `<script>alert(1)</script>`
   - Tests XSS pattern detection

5. **Directory Traversal** (1 packet)
   - Path: `/../../etc/passwd`
   - Tests path traversal detection

6. **Command Injection** (1 packet)
   - Payload: `; ls -la`
   - Tests command injection detection

### 3. Fixed PCAP Parser Compatibility

**Issue Discovered**: The application's PCAP parser was incompatible with the `pcap-decoder` library's actual API.

**Root Causes**:
1. Constructor was being passed data, but the library expects no arguments
2. Data was being passed as `ArrayBuffer` instead of `Uint8Array`
3. Parser expected fully-decoded packet objects with `network` and `transport` layers, but `pcap-decoder` only provides raw bytes

**Fixes Applied** to [client/src/services/pcapParser.ts](file:///Users/delphijc/Projects/net-pack-parser/client/src/services/pcapParser.ts):

1. **Corrected decoder instantiation and usage**:
   ```typescript
   // Before (incorrect):
   const decoder = new (PcapDecoder as any)(data);
   const decodedPackets = decoder.decode();
   
   // After (correct):
   const decoder = new (PcapDecoder as any)();
   const decodedPackets = decoder.decode(new Uint8Array(data));
   ```

2. **Added manual packet header parsing**:
   - Parse Ethernet headers (skip first 14 bytes)
   - Extract IP addresses from IP header (bytes 12-19)
   - Determine protocol from IP protocol field (byte 9)
   - Extract TCP/UDP ports from transport layer
   - Handle variable IP header length correctly

3. **Corrected header field names**:
   ```typescript
   // Before (incorrect):
   packet.header.timestampSeconds
   packet.header.captureLength
   
   // After (correct):
   packet.header.ts_sec
   packet.header.incl_len
   ```

### 4. Created Testing Guide

The [demo.md](file:///Users/delphijc/Projects/net-pack-parser/demo/demo.md) file provides:
- Step-by-step instructions for loading the PCAP
- Expected behaviors for each packet type
- Verification steps for threat detection
- Troubleshooting tips

## Validation

### PCAP File Validity
Verified with `tcpdump`:
```bash
$ tcpdump -r demo/demo.pcap -n -c 5
reading from file demo/demo.pcap, link-type EN10MB (Ethernet)
19:49:12.548000 IP 192.168.1.10.12345 > 192.168.1.20.80: HTTP: GET /index.html
19:49:12.648000 IP 192.168.1.20.80 > 192.168.1.10.12345: HTTP: HTTP/1.1 200 OK
19:49:13.648000 IP 192.168.1.15.54321 > 192.168.1.20.80: HTTP: GET /login?user=' OR '1'='1
19:49:14.648000 IP 192.168.1.15.54322 > 192.168.1.20.80: HTTP: GET /search?q=UNION SELECT
19:49:15.648000 IP 192.0.2.1.443 > 192.168.1.50.55555: HTTP/1.1 200 OK
```

### Decoder Testing
Created test script confirming packets are now parsed:
```bash
$ node test_simple_decode.js
Packet 0: ts_sec=1764895752, body_length=126
Packet 1: ts_sec=1764895752, body_length=164
Packet 2: ts_sec=1764895753, body_length=120
Packet 3: ts_sec=1764895754, body_length=132
```

## Browser Recording

A browser recording was created showing the application loading:

![App Loading](file:///Users/delphijc/.gemini/antigravity/brain/8b32bd2f-1ac8-4e0e-9078-6afa9b323d8e/app_demo_walkthrough_1764897590943.webp)

**Note**: Automated file upload via browser tools is not supported. Manual testing is required to complete the full walkthrough:

1. Navigate to `http://localhost:5173`
2. Click "Parser & Upload" tab
3. Manually select `demo/demo.pcap` via the file picker
4. Verify packets are displayed with threat indicators
5. Click through packet details and threat information

## Files Modified

### Modified Files
- [client/src/services/pcapParser.ts](file:///Users/delphijc/Projects/net-pack-parser/client/src/services/pcapParser.ts) - Fixed pcap-decoder usage and added manual header parsing

### Created Files
- [demo/demo.pcap](file:///Users/delphijc/Projects/net-pack-parser/demo/demo.pcap) - Demo PCAP file with test traffic
- [demo/demo.md](file:///Users/delphijc/Projects/net-pack-parser/demo/demo.md) - Testing guide
- [demo/generate_pcap.js](file:///Users/delphijc/Projects/net-pack-parser/demo/generate_pcap.js) - PCAP generation script

### Debug/Test Files (can be removed)
- `debug_pcap_decoder.js`
- `test_simple_decode.js`

## Next Steps

To complete the demo validation:

1. **Manual Testing**: Upload `demo/demo.pcap` and verify:
   - All 8 packets are displayed
   - Shield icons appear on threat packets
   - Packet details show correct IPs and ports
   - Threat tabs show detected issues
   - Dashboard shows threat statistics

2. **Cleanup**: Remove debug scripts if no longer needed

3. **Documentation**: Consider adding demo instructions to main README.md
