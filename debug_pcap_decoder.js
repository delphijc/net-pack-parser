const fs = require('fs');
const PcapDecoderModule = require('./client/node_modules/pcap-decoder');
const PcapDecoder = PcapDecoderModule.default;
const buffer = fs.readFileSync('demo/demo.pcap');
console.log('File size:', buffer.length);
console.log('First 24 bytes (hex):', buffer.slice(0, 24).toString('hex'));
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
console.log('ArrayBuffer size:', arrayBuffer.byteLength);
const decoder = new PcapDecoder();

// Try to see if decode works at all
console.log('Before decode - decoder.data length:', decoder.data ? decoder.data.length : 'null');
console.log('Calling decode...');

const packets = [];
let packetCount = 0;
for (const packet of decoder.decode(arrayBuffer)) {
    console.log(`Packet ${packetCount}:`, {
        header: packet.header,
        bodyLength: packet.body.length
    });
    packets.push(packet);
    packetCount++;
}

console.log('After decode - decoder.data length:', decoder.data ? decoder.data.length : 'null');
console.log(`Total packets: ${packets.length}`);

if (packets.length > 0) {
    const packet = packets[0];
    console.log('Packet 0 data length:', packet.data.length);
    console.log('Packet 0 buffer length:', packet.data.buffer.byteLength);
    console.log('Packet 0 byteOffset:', packet.data.byteOffset);

    if (packet.data.buffer.byteLength > packet.data.length) {
        console.log('CONFIRMED: packet.data is a view on a larger buffer.');
    } else {
        console.log('packet.data has its own buffer.');
    }
}
