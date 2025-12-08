const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'demo.pcap');

// --- Helper Functions for Buffer Construction ---

function writeUInt32LE(buffer, value, offset) {
    buffer.writeUInt32LE(value, offset);
    return offset + 4;
}

function writeUInt16LE(buffer, value, offset) {
    buffer.writeUInt16LE(value, offset);
    return offset + 2;
}

function writeUInt16BE(buffer, value, offset) {
    buffer.writeUInt16BE(value, offset);
    return offset + 2;
}

function writeUInt32BE(buffer, value, offset) {
    buffer.writeUInt32BE(value, offset);
    return offset + 4;
}

// --- PCAP Writer ---

class PcapWriter {
    constructor(filename) {
        this.fd = fs.openSync(filename, 'w');
        this.writeGlobalHeader();
    }

    writeGlobalHeader() {
        const buffer = Buffer.alloc(24);
        let offset = 0;
        offset = writeUInt32LE(buffer, 0xa1b2c3d4, offset); // Magic Number
        offset = writeUInt16LE(buffer, 2, offset);          // Major Version
        offset = writeUInt16LE(buffer, 4, offset);          // Minor Version
        offset = writeUInt32LE(buffer, 0, offset);          // Thiszone
        offset = writeUInt32LE(buffer, 0, offset);          // Sigfigs
        offset = writeUInt32LE(buffer, 65535, offset);      // Snaplen
        offset = writeUInt32LE(buffer, 1, offset);          // Network (Ethernet)
        fs.writeSync(this.fd, buffer);
    }

    writePacket(data, timestamp = Date.now()) {
        const buffer = Buffer.alloc(16);
        const seconds = Math.floor(timestamp / 1000);
        const microseconds = (timestamp % 1000) * 1000;

        let offset = 0;
        offset = writeUInt32LE(buffer, seconds, offset);
        offset = writeUInt32LE(buffer, microseconds, offset);
        offset = writeUInt32LE(buffer, data.length, offset); // Included Length
        offset = writeUInt32LE(buffer, data.length, offset); // Original Length

        fs.writeSync(this.fd, buffer);
        fs.writeSync(this.fd, data);
    }

    close() {
        fs.closeSync(this.fd);
    }
}

// --- Protocol Headers ---

function createEthernetHeader(srcMac, destMac, type = 0x0800) {
    const buffer = Buffer.alloc(14);
    // Dest MAC
    Buffer.from(destMac.replace(/:/g, ''), 'hex').copy(buffer, 0);
    // Src MAC
    Buffer.from(srcMac.replace(/:/g, ''), 'hex').copy(buffer, 6);
    // Type
    writeUInt16BE(buffer, type, 12);
    return buffer;
}

function createIPHeader(srcIP, destIP, protocol, dataLength) {
    const buffer = Buffer.alloc(20);
    const totalLength = 20 + dataLength;

    buffer[0] = 0x45; // Version 4, IHL 5
    buffer[1] = 0x00; // TOS
    writeUInt16BE(buffer, totalLength, 2);
    writeUInt16BE(buffer, 0x1234, 4); // ID
    writeUInt16BE(buffer, 0x4000, 6); // Flags (Don't Fragment)
    buffer[8] = 64; // TTL
    buffer[9] = protocol;

    // Checksum (placeholder 0 for calculation)
    writeUInt16BE(buffer, 0, 10);

    // Source IP
    const srcParts = srcIP.split('.').map(Number);
    for (let i = 0; i < 4; i++) buffer[12 + i] = srcParts[i];

    // Dest IP
    const destParts = destIP.split('.').map(Number);
    for (let i = 0; i < 4; i++) buffer[16 + i] = destParts[i];

    // Calculate Checksum
    let checksum = 0;
    for (let i = 0; i < 20; i += 2) {
        checksum += (buffer[i] << 8) + buffer[i + 1];
    }
    checksum = (checksum >> 16) + (checksum & 0xFFFF);
    checksum = ~checksum & 0xFFFF;
    writeUInt16BE(buffer, checksum, 10);

    return buffer;
}

function createTCPHeader(srcPort, destPort, seq, ack, payloadLength) {
    const buffer = Buffer.alloc(20);

    writeUInt16BE(buffer, srcPort, 0);
    writeUInt16BE(buffer, destPort, 2);
    writeUInt32BE(buffer, seq, 4);
    writeUInt32BE(buffer, ack, 8);

    // Data Offset (5 words = 20 bytes) + Flags (PSH, ACK)
    // 0x50 = 0101 0000 (Data Offset 5)
    // 0x18 = 0001 1000 (PSH, ACK)
    buffer[12] = 0x50;
    buffer[13] = 0x18;

    writeUInt16BE(buffer, 65535, 14); // Window Size
    writeUInt16BE(buffer, 0, 16); // Checksum (ignored for demo)
    writeUInt16BE(buffer, 0, 18); // Urgent Pointer

    return buffer;
}

function createUDPHeader(srcPort, destPort, payloadLength) {
    const buffer = Buffer.alloc(8);
    writeUInt16BE(buffer, srcPort, 0);
    writeUInt16BE(buffer, destPort, 2);
    writeUInt16BE(buffer, 8 + payloadLength, 4); // Length
    writeUInt16BE(buffer, 0, 6); // Checksum (ignored)
    return buffer;
}

// --- Packet Construction ---

function createTCPPacket(srcIP, destIP, srcPort, destPort, payloadStr) {
    const payload = Buffer.from(payloadStr);
    const eth = createEthernetHeader('00:11:22:33:44:55', '66:77:88:99:AA:BB');
    const tcp = createTCPHeader(srcPort, destPort, 1000, 2000, payload.length);
    const ip = createIPHeader(srcIP, destIP, 6, tcp.length + payload.length);

    return Buffer.concat([eth, ip, tcp, payload]);
}

function createUDPPacket(srcIP, destIP, srcPort, destPort, payloadStr) {
    const payload = Buffer.from(payloadStr);
    const eth = createEthernetHeader('00:11:22:33:44:55', '66:77:88:99:AA:BB');
    const udp = createUDPHeader(srcPort, destPort, payload.length);
    const ip = createIPHeader(srcIP, destIP, 17, udp.length + payload.length);

    return Buffer.concat([eth, ip, udp, payload]);
}

// --- Main Generation ---

const writer = new PcapWriter(OUTPUT_FILE);
let timestamp = Date.now();

// 1. Normal HTTP Traffic
writer.writePacket(createTCPPacket(
    '192.168.1.10', '192.168.1.20', 12345, 80,
    "GET /index.html HTTP/1.1\r\nHost: example.com\r\nUser-Agent: Mozilla/5.0\r\n\r\n"
), timestamp += 100);

writer.writePacket(createTCPPacket(
    '192.168.1.20', '192.168.1.10', 80, 12345,
    "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: 50\r\n\r\n<html><body><h1>Hello World</h1></body></html>"
), timestamp += 100);

// 2. SQL Injection (Classic)
writer.writePacket(createTCPPacket(
    '192.168.1.15', '192.168.1.20', 54321, 80,
    "GET /login?user=' OR '1'='1 HTTP/1.1\r\nHost: vulnerable-app.com\r\n\r\n"
), timestamp += 1000);

// 3. SQL Injection (Union)
writer.writePacket(createTCPPacket(
    '192.168.1.15', '192.168.1.20', 54322, 80,
    "GET /search?q=UNION SELECT * FROM users HTTP/1.1\r\nHost: vulnerable-app.com\r\n\r\n"
), timestamp += 1000);

// 4. IOC IP Match (Source IP -> 192.168.1.100)
writer.writePacket(createTCPPacket(
    '192.168.1.100', '192.168.1.50', 443, 55555,
    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"cmd\": \"exec\"}"
), timestamp += 1000);

// 5. IOC Domain Match (HTTP Host -> malicious-site.com)
writer.writePacket(createTCPPacket(
    '192.168.1.60', '93.184.216.34', 60000, 80,
    "GET /malware.exe HTTP/1.1\r\nHost: malicious-site.com\r\n\r\n"
), timestamp += 1000);

// 6. XSS Attack
writer.writePacket(createTCPPacket(
    '192.168.1.70', '192.168.1.20', 33333, 80,
    "POST /comment HTTP/1.1\r\nHost: blog.com\r\nContent-Length: 25\r\n\r\n<script>alert(1)</script>"
), timestamp += 1000);

// 7. Base64 Content & Pattern
writer.writePacket(createTCPPacket(
    '192.168.1.80', '192.168.1.20', 44444, 80,
    "HTTP/1.1 200 OK\r\n\r\nThis packet contains a base64 string: SGVsbG8gV29ybGQh This is a string extraction test. Also checking for base64_decode pattern."
), timestamp += 1000);

// 8. Command Injection & Eval
writer.writePacket(createTCPPacket(
    '192.168.1.90', '192.168.1.20', 55555, 80,
    "GET /ping?ip=127.0.0.1; eval(document.cookie) HTTP/1.1\r\nHost: admin-tool.com\r\n\r\n"
), timestamp += 1000);

writer.close();
console.log(`Generated ${OUTPUT_FILE}`);
