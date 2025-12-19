import path from 'path';

// @ts-ignore
import pcapParser from 'pcap-parser';

const pcapPath = path.join(__dirname, '../docs/demo_assets/demo.pcap');

const testRawParser = () => {
    console.log('Testing raw pcap-parser with file:', pcapPath);

    try {
        const parser = pcapParser.parse(pcapPath);
        let count = 0;

        parser.on('packet', (packet: any) => {
            count++;
            if (count % 100 === 0) console.log(`Parsed ${count}`);
        });

        parser.on('end', () => {
            console.log(`Parsing complete. Total: ${count}`);
        });

        parser.on('error', (err: any) => {
            console.error('Parser error:', err);
        });
    } catch (err) {
        console.error("Synchronous error:", err);
    }
};

testRawParser();
