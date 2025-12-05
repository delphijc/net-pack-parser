/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { iocService, type IOC } from './iocService';

describe('IOCService', () => {
  const mockIOC: IOC = {
    id: 'test-ioc-1',
    type: 'ip',
    value: '1.2.3.4',
    description: 'Test Malicious IP',
    severity: 'high',
    enabled: true,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  beforeEach(async () => {
    await iocService.clearAll();
  });

  it('should add and retrieve an IOC', async () => {
    await iocService.addIOC(mockIOC);
    const iocs = await iocService.getAllIOCs();
    expect(iocs).toHaveLength(1);
    expect(iocs[0]).toEqual(mockIOC);
  });

  it('should remove an IOC', async () => {
    await iocService.addIOC(mockIOC);
    await iocService.removeIOC(mockIOC.id);
    const iocs = await iocService.getAllIOCs();
    expect(iocs).toHaveLength(0);
  });

  it('should retrieve IOCs by type', async () => {
    await iocService.addIOC(mockIOC);
    await iocService.addIOC({
      ...mockIOC,
      id: 'test-ioc-2',
      type: 'domain',
      value: 'example.com',
    });

    const ipIOCs = await iocService.getIOCsByType('ip');
    expect(ipIOCs).toHaveLength(1);
    expect(ipIOCs[0].type).toBe('ip');

    const domainIOCs = await iocService.getIOCsByType('domain');
    expect(domainIOCs).toHaveLength(1);
    expect(domainIOCs[0].type).toBe('domain');
  });

  it('should import IOCs (merge mode)', async () => {
    await iocService.addIOC(mockIOC);
    const newIOCs: IOC[] = [
      {
        ...mockIOC,
        id: 'test-ioc-2',
        value: '5.6.7.8',
      },
    ];

    await iocService.importIOCs(newIOCs, 'merge');
    const iocs = await iocService.getAllIOCs();
    expect(iocs).toHaveLength(2);
  });

  it('should import IOCs (replace mode)', async () => {
    await iocService.addIOC(mockIOC);
    const newIOCs: IOC[] = [
      {
        ...mockIOC,
        id: 'test-ioc-2',
        value: '5.6.7.8',
      },
    ];

    await iocService.importIOCs(newIOCs, 'replace');
    const iocs = await iocService.getAllIOCs();
    expect(iocs).toHaveLength(1);
    expect(iocs[0].id).toBe('test-ioc-2');
  });
  it('should maintain cache consistency', async () => {
    await iocService.addIOC(mockIOC);
    const cache = iocService.getIOCCache();
    expect(cache.ip.has(mockIOC.value)).toBe(true);
    expect(cache.map.get(mockIOC.value)).toEqual(mockIOC);

    await iocService.removeIOC(mockIOC.id);
    expect(cache.ip.has(mockIOC.value)).toBe(false);
    expect(cache.map.has(mockIOC.value)).toBe(false);
  });

  it('should not cache disabled IOCs', async () => {
    const disabledIOC = { ...mockIOC, id: 'disabled-1', enabled: false, value: '9.9.9.9' };
    await iocService.addIOC(disabledIOC);
    const cache = iocService.getIOCCache();
    expect(cache.ip.has(disabledIOC.value)).toBe(false);
    expect(cache.map.has(disabledIOC.value)).toBe(false);
  });

  it('should clear cache on clearAll', async () => {
    await iocService.addIOC(mockIOC);
    await iocService.clearAll();
    const cache = iocService.getIOCCache();
    expect(cache.ip.size).toBe(0);
    expect(cache.map.size).toBe(0);
  });
});
