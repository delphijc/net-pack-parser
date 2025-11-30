import { describe, it, expect } from 'vitest';
import { validateBpfFilter, matchBpfFilter, parseBpfFilter } from './bpfFilter';
import type { Packet } from '../types/packet';

describe('BPF Filter Engine', () => {
  describe('validateBpfFilter', () => {
    it('should validate valid BPF expressions', () => {
      expect(validateBpfFilter('tcp').isValid).toBe(true);
      expect(validateBpfFilter('udp').isValid).toBe(true);
      expect(validateBpfFilter('icmp').isValid).toBe(true);
      expect(validateBpfFilter('port 80').isValid).toBe(true);
      expect(validateBpfFilter('src port 80').isValid).toBe(true);
      expect(validateBpfFilter('dst port 80').isValid).toBe(true);
      expect(validateBpfFilter('host 192.168.1.1').isValid).toBe(true);
      expect(validateBpfFilter('src host 192.168.1.1').isValid).toBe(true);
      expect(validateBpfFilter('dst host 192.168.1.1').isValid).toBe(true);
      expect(validateBpfFilter('net 192.168.1.0/24').isValid).toBe(true);
      expect(validateBpfFilter('tcp and port 80').isValid).toBe(true);
      expect(validateBpfFilter('tcp or udp').isValid).toBe(true);
      expect(validateBpfFilter('not tcp').isValid).toBe(true);
      expect(validateBpfFilter('(tcp and port 80) or udp').isValid).toBe(true);
    });

    it('should invalidate invalid BPF expressions', () => {
      expect(validateBpfFilter('invalid').isValid).toBe(false);
      expect(validateBpfFilter('tcp and').isValid).toBe(false); // Missing right operand
      expect(validateBpfFilter('port').isValid).toBe(false); // Missing number
      expect(validateBpfFilter('host').isValid).toBe(false); // Missing IP
      expect(validateBpfFilter('net').isValid).toBe(false); // Missing CIDR
      expect(validateBpfFilter('tcp or').isValid).toBe(false); // Missing right operand
      expect(validateBpfFilter('()').isValid).toBe(false); // Empty parens (parser might allow, but semantically invalid usually, or just empty)
      // Our simple parser might throw on empty parens if it expects an expression inside
    });

    it('should handle empty strings as valid (no filter)', () => {
      expect(validateBpfFilter('').isValid).toBe(true);
      expect(validateBpfFilter('   ').isValid).toBe(true);
    });
  });

  describe('matchBpfFilter', () => {
    const mockPacket: Packet = {
      id: '1',
      timestamp: 1234567890,
      sourceIP: '192.168.1.10',
      destIP: '10.0.0.5',
      sourcePort: 12345,
      destPort: 80,
      protocol: 'TCP',
      length: 64,
      rawData: new ArrayBuffer(0),
      detectedProtocols: ['TCP', 'HTTP'],
    };

    const mockUdpPacket: Packet = {
      ...mockPacket,
      protocol: 'UDP',
      sourcePort: 53,
      destPort: 53,
      detectedProtocols: ['UDP', 'DNS'],
    };

    it('should match protocol', () => {
      const tcpAst = parseBpfFilter('tcp');
      const udpAst = parseBpfFilter('udp');

      if (tcpAst) expect(matchBpfFilter(mockPacket, tcpAst)).toBe(true);
      if (udpAst) expect(matchBpfFilter(mockPacket, udpAst)).toBe(false);

      if (udpAst) expect(matchBpfFilter(mockUdpPacket, udpAst)).toBe(true);
    });

    it('should match host', () => {
      const hostAst = parseBpfFilter('host 192.168.1.10');
      const srcHostAst = parseBpfFilter('src host 192.168.1.10');
      const dstHostAst = parseBpfFilter('dst host 10.0.0.5');
      const noMatchHostAst = parseBpfFilter('host 1.1.1.1');

      if (hostAst) expect(matchBpfFilter(mockPacket, hostAst)).toBe(true);
      if (srcHostAst) expect(matchBpfFilter(mockPacket, srcHostAst)).toBe(true);
      if (dstHostAst) expect(matchBpfFilter(mockPacket, dstHostAst)).toBe(true);
      if (noMatchHostAst)
        expect(matchBpfFilter(mockPacket, noMatchHostAst)).toBe(false);
    });

    it('should match port', () => {
      const portAst = parseBpfFilter('port 80');
      const srcPortAst = parseBpfFilter('src port 12345');
      const dstPortAst = parseBpfFilter('dst port 80');
      const noMatchPortAst = parseBpfFilter('port 443');

      if (portAst) expect(matchBpfFilter(mockPacket, portAst)).toBe(true);
      if (srcPortAst) expect(matchBpfFilter(mockPacket, srcPortAst)).toBe(true);
      if (dstPortAst) expect(matchBpfFilter(mockPacket, dstPortAst)).toBe(true);
      if (noMatchPortAst)
        expect(matchBpfFilter(mockPacket, noMatchPortAst)).toBe(false);
    });

    it('should match net (CIDR)', () => {
      const netAst = parseBpfFilter('net 192.168.1.0/24');
      const srcNetAst = parseBpfFilter('src net 192.168.0.0/16');
      const dstNetAst = parseBpfFilter('dst net 10.0.0.0/8');
      const noMatchNetAst = parseBpfFilter('net 172.16.0.0/12');

      if (netAst) expect(matchBpfFilter(mockPacket, netAst)).toBe(true);
      if (srcNetAst) expect(matchBpfFilter(mockPacket, srcNetAst)).toBe(true);
      if (dstNetAst) expect(matchBpfFilter(mockPacket, dstNetAst)).toBe(true);
      if (noMatchNetAst)
        expect(matchBpfFilter(mockPacket, noMatchNetAst)).toBe(false);
    });

    it('should match boolean operators', () => {
      const andAst = parseBpfFilter('tcp and port 80');
      const orAst = parseBpfFilter('tcp or udp');
      const notAst = parseBpfFilter('not udp');
      const complexAst = parseBpfFilter(
        '(src host 192.168.1.10 and dst port 80) or tcp',
      );

      if (andAst) expect(matchBpfFilter(mockPacket, andAst)).toBe(true);
      if (orAst) expect(matchBpfFilter(mockPacket, orAst)).toBe(true);
      if (notAst) expect(matchBpfFilter(mockPacket, notAst)).toBe(true);
      if (complexAst) expect(matchBpfFilter(mockPacket, complexAst)).toBe(true);
    });
  });
});
