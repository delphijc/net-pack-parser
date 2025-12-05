const fs = require('fs');
const PcapDecoderModule = require('./client/node_modules/pcap-decoder');
const PcapDecoder = PcapDecoderModule.default;

const buffer = fs.readFileSync('demo/demo.pcap');

// Create decoder and feed it data in one go
const decoder = new PcapDecoder();

console.log('Decoder initial data length:', decoder.data.length);

// Call decode with the entire buffer converted to Uint8Array
const uint8Array = new Uint8Array(buffer);
console.log('Feeding Uint8Array of length:', uint8Array.length);

let count = 0;
for (const packet of decoder.decode(uint8Array)) {
    console.log(`Packet ${count}: ts_sec=${packet.header.ts_sec}, body_length=${packet.body.length}`);
    count++;
    if (count > 3) break; // Just show first few
}

console.log(`\nTotal first pass packets: ${count}`);
console.log('Remaining data in decoder:', decoder.data.length);
