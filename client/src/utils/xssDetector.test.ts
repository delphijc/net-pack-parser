// client/src/utils/xssDetector.test.ts

import { describe, it, expect } from 'vitest';
import { detectXss } from './xssDetector';
import type { Packet } from '@/types/packet';

describe('detectXss', () => {
  const createPacket = (rawDataString: string): Packet => {
    return {
      id: 'test-packet-id',
      timestamp: 1234567890,
      sourceIP: '192.168.1.100',
      destIP: '10.0.0.1',
      sourcePort: 12345,
      destPort: 80,
      protocol: 'TCP',
      length: 100,
      rawData: new TextEncoder().encode(rawDataString).buffer,
      detectedProtocols: ['HTTP', 'TCP'],
    };
  };

  it('should detect simple script tags in query string', () => {
    const rawData =
      'GET /search?q=<script>alert(1)</script> HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectXss(packet);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('Cross-Site Scripting (XSS)');
    expect(threats[0].severity).toBe('high');
    expect(threats[0].mitreAttack).toContain('T1059.007');
    expect(threats[0].description).toContain('query string');
  });

  it('should detect event handlers in POST body', () => {
    const rawData =
      'POST /submit HTTP/1.1\r\nHost: example.com\r\n\r\nname=foo&bio=<img src=x onerror=alert(1)>';
    const packet = createPacket(rawData);
    const threats = detectXss(packet);

    expect(threats).toHaveLength(1);
    expect(threats[0].description).toContain('post data');
  });

  it('should detect javascript: URIs', () => {
    const rawData =
      'GET /?url=javascript:alert(1) HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectXss(packet);

    expect(threats).toHaveLength(1);
  });

  it('should detect URL encoded XSS', () => {
    // <script>alert(1)</script> URL encoded
    const encoded = '%3Cscript%3Ealert(1)%3C%2Fscript%3E';
    const rawData = `GET /search?q=${encoded} HTTP/1.1\r\nHost: example.com\r\n\r\n`;
    const packet = createPacket(rawData);
    const threats = detectXss(packet);

    expect(threats).toHaveLength(1);
    expect(threats[0].description).toContain('encoding: url');
  });

  it('should detect HTML entity encoded XSS', () => {
    // <img src=x onerror=alert(1)> HTML entity encoded
    // &lt;img src=x onerror=alert(1)&gt;
    // Note: Our detector handles entities inside URL decoded strings usually,
    // but let's test if it catches entities in a query string that might be URL encoded first or raw.
    // If raw:
    const rawData =
      'GET /?q=&lt;script&gt;alert(1)&lt;/script&gt; HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectXss(packet);

    // Our detector does: 1. Raw, 2. URL Decode, 3. HTML Entity Decode (of URL decoded)
    // &lt; is not URL encoded here, so URL decode leaves it as &lt;.
    // Then HTML entity decode changes &lt; to <.
    expect(threats).toHaveLength(1);
    expect(threats[0].description).toContain('encoding: html-entity');
  });

  it('should detect polyglots', () => {
    const rawData =
      'GET /?q=javascript:/*--></title></style></textarea></script>*/alert(1) HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectXss(packet);

    expect(threats).toHaveLength(1);
  });

  it('should not detect benign traffic', () => {
    const rawData =
      'GET /search?q=hello+world HTTP/1.1\r\nHost: example.com\r\n\r\n';
    const packet = createPacket(rawData);
    const threats = detectXss(packet);

    expect(threats).toHaveLength(0);
  });

  it('should ignore non-HTTP packets', () => {
    const packet = createPacket('');
    packet.detectedProtocols = ['TCP']; // No HTTP
    const threats = detectXss(packet);

    expect(threats).toHaveLength(0);
  });
});
