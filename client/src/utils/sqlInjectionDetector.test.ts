// client/src/utils/sqlInjectionDetector.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectSqlInjection } from './sqlInjectionDetector';
import type { Packet } from '@/types/packet';

// Mock uuidv4
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

describe('SQL Injection Detector', () => {
  let mockPacket: Packet;

  beforeEach(() => {
    mockPacket = {
      id: 'packet-test-1',
      timestamp: Date.now(),
      sourceIP: '192.168.1.1',
      destIP: '192.168.1.100',
      sourcePort: 12345,
      destPort: 80,
      protocol: 'TCP',
      length: 100,
      rawData: new TextEncoder().encode(
        'GET / HTTP/1.1\r\nHost: example.com\r\n\r\n',
      ).buffer,
      detectedProtocols: ['TCP', 'HTTP'],
    };
  });

  it('should return an empty array if no SQL injection is detected', () => {
    const threats = detectSqlInjection(mockPacket);
    expect(threats).toHaveLength(0);
  });

  it('should return an empty array if the packet is not HTTP(S)', () => {
    mockPacket.detectedProtocols = ['TCP'];
    const threats = detectSqlInjection(mockPacket);
    expect(threats).toHaveLength(0);
  });

  it('should detect classic SQL injection in GET query parameter (URL-encoded)', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET /search?q=test%27%20OR%20%271%27%3D%271 HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].severity).toBe('critical');
    expect(threats[0].mitreAttack).toEqual(['T1190']);
    expect(threats[0].description).toContain('query string (encoding: url)'); // Detected via URL-decoded version
    expect(threats[0].matchDetails).toEqual(
      expect.arrayContaining([
        { offset: 6, length: 11 },
        { offset: 8, length: 9 },
      ]),
    );
  });

  it('should detect classic SQL injection in POST body (URL-encoded)', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'POST /login HTTP/1.1\r\nHost: example.com\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 30\r\n\r\nusername=admin%27--&password=pass',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('post data (encoding: url)'); // Detected via URL-decoded version
  });

  it('should detect UNION SELECT (none encoded)', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET /products?id=1 UNION SELECT null,null,null HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('query string (encoding: none)');
  });

  it('should detect URL-encoded SQL injection', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET /test?param=%20UNION%20SELECT%20*%20FROM%20users HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('query string (encoding: url)');
  });

  it('should detect hex-encoded SQL injection', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET /test?param=0x20554e494f4e2053454c454354 HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer; // Hex for " UNION SELECT"
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('query string (encoding: hex)');
  });

  it('should detect doubly encoded SQL injection (URL then Hex)', () => {
    // Hex for " UNION SELECT" is "20554e494f4e2053454c454354"
    // URL encoded version of "0x20554e494f4e2053454c454354"
    const hexSql = '0x20554e494f4e2053454c454354';
    const urlEncodedHexSql = encodeURIComponent(hexSql); // "%30x20554e494f4e2053454c454354"
    mockPacket.rawData = new TextEncoder().encode(
      `GET /test?param=${urlEncodedHexSql} HTTP/1.1\r\nHost: example.com\r\n\r\n`,
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain(
      'query string (encoding: hex)', // Note: encodeURIComponent doesn't change hex strings with safe chars
    );
  });

  it('should detect WAITFOR DELAY (none encoded)', () => {
    mockPacket.rawData = new TextEncoder().encode(
      "GET /report?id=1;WAITFOR DELAY '00:00:05' HTTP/1.1\r\nHost: example.com\r\n\r\n",
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('query string (encoding: none)');
  });

  it('should detect BENCHMARK (none encoded)', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET /data?query=x; BENCHMARK(10000000,MD5(1)) HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('query string (encoding: none)');
  });

  it('should detect boolean-based AND 1=1 (none encoded)', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET /filter?category=1 AND 1=1 HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('query string (encoding: none)');
  });

  it('should detect boolean-based OR 1=2 (none encoded)', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET /filter?category=1 OR 1=2 HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('query string (encoding: none)');
  });

  it('should correctly identify matches within a larger string', () => {
    mockPacket.rawData = new TextEncoder().encode(
      "GET /payload?data=someprefix' OR '1'='1somesuffix HTTP/1.1\r\nHost: example.com\r\n\r\n",
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].matchDetails![0].offset).toBe(15); // Offset of ' OR '1'='1 in "data=someprefix' OR '1'='1somesuffix"
  });

  it('should handle multiple unique threats in different fields of the payload', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'POST /update HTTP/1.1\r\nHost: example.com\r\nCookie: session=abc%27--\r\nUser-Agent: Mozilla/5.0 (Windows U) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.86 Safari/533.4;WAITFOR%20DELAY%20%2700:00:05%27\r\nContent-Length: 10\r\n\r\ndata=value',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    // Expecting 2 threats: one from Cookie, one from User-Agent
    expect(threats).toHaveLength(2);
    const cookieThreat = threats.find((t) =>
      t.description.includes('cookie header'),
    );
    const userAgentThreat = threats.find((t) =>
      t.description.includes('user-agent header'),
    );

    expect(cookieThreat).toBeDefined();
    expect(cookieThreat?.description).toContain(
      'cookie header (encoding: url)',
    );
    expect(cookieThreat?.matchDetails?.length).toBeGreaterThan(0);

    expect(userAgentThreat).toBeDefined();
    expect(userAgentThreat?.description).toContain(
      'user-agent header (encoding: url)',
    );
    expect(userAgentThreat?.matchDetails?.length).toBeGreaterThan(0);
  });

  it('should detect SQLi in User-Agent header', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET / HTTP/1.1\r\nHost: example.com\r\nUser-Agent: Mozilla/5.0 (Windows U) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.86 Safari/533.4%27%20OR%20%271%27%3D%271\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain(
      'user-agent header (encoding: url)',
    );
  });

  it('should detect SQLi in Cookie header', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET / HTTP/1.1\r\nHost: example.com\r\nCookie: sessionid=abc%27--\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('cookie header (encoding: url)');
  });

  it('should handle multiple matches within the same field and encoding, aggregating matchDetails', () => {
    mockPacket.rawData = new TextEncoder().encode(
      'GET /search?q=test%27%20OR%20%271%27%3D%271%3BWAITFOR%20DELAY%20%2700:00:05%27 HTTP/1.1\r\nHost: example.com\r\n\r\n',
    ).buffer;
    const threats = detectSqlInjection(mockPacket);

    expect(threats).toHaveLength(1);
    expect(threats[0].type).toBe('SQL Injection');
    expect(threats[0].description).toContain('query string (encoding: url)');
    expect(threats[0].matchDetails?.length).toBe(3); // Three patterns detected: ' OR '1'='1, OR '1'='1, AND WAITFOR
    // Ensure both patterns are detected and their matchDetails are present
    const decodedQueryString = "q=test' OR '1'='1;WAITFOR DELAY '00:00:05'";
    const firstMatch = decodedQueryString.match(/'\s*OR\s+'?\d+'?='?\d+/);
    const secondMatch = decodedQueryString.match(
      /WAITFOR\s+DELAY\s+'\d{2}:\d{2}:\d{2}'/i,
    );

    expect(threats[0].matchDetails).toContainEqual({
      offset: firstMatch!.index!,
      length: firstMatch![0].length,
    });
    expect(threats[0].matchDetails).toContainEqual({
      offset: secondMatch!.index!,
      length: secondMatch![0].length,
    });
  });
});
