import { describe, it, expect } from 'vitest';
import { generateFlowId } from './flowUtils';
import type { Packet } from '../types/packet';

describe('generateFlowId', () => {
  it('should generate the same flowId for packets in the same direction', () => {
    const packet1: Partial<Packet> = {
      sourceIP: '192.168.1.1',
      destIP: '10.0.0.1',
      sourcePort: 12345,
      destPort: 80,
      protocol: 'TCP',
    };
    const flowId1 = generateFlowId(packet1 as Packet);

    // Exact same packet details
    const flowId2 = generateFlowId(packet1 as Packet);

    expect(flowId1).toBe(flowId2);
    expect(flowId1).toBeTruthy();
  });

  it('should generate the same flowId for reverse direction packets (bidirectional flow)', () => {
    const forward: Partial<Packet> = {
      sourceIP: '192.168.1.1',
      destIP: '10.0.0.1',
      sourcePort: 12345,
      destPort: 80,
      protocol: 'TCP',
    };
    const reverse: Partial<Packet> = {
      sourceIP: '10.0.0.1',
      destIP: '192.168.1.1',
      sourcePort: 80,
      destPort: 12345,
      protocol: 'TCP',
    };

    const flowIdForward = generateFlowId(forward as Packet);
    const flowIdReverse = generateFlowId(reverse as Packet);

    expect(flowIdForward).toBe(flowIdReverse);
  });

  it('should generate different flowIds for different flows', () => {
    const flow1: Partial<Packet> = {
      sourceIP: '192.168.1.1',
      destIP: '10.0.0.1',
      sourcePort: 12345,
      destPort: 80,
      protocol: 'TCP',
    };
    const flow2: Partial<Packet> = {
      sourceIP: '192.168.1.2', // Different Source IP
      destIP: '10.0.0.1',
      sourcePort: 12345,
      destPort: 80,
      protocol: 'TCP',
    };

    expect(generateFlowId(flow1 as Packet)).not.toBe(
      generateFlowId(flow2 as Packet),
    );
  });
});
