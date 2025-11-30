// src/services/localStorage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
  store: {} as { [key: string]: string },
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value.toString();
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  },
  get length() {
    return Object.keys(this.store).length;
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

describe('LocalStorageService', () => {
  let localStorageService: any;

  beforeEach(async () => {
    vi.resetModules();
    window.localStorage.clear();
    const module = await import('./localStorage');
    localStorageService = module.localStorageService;
  });

  it('should set and get a value with namespace', () => {
    const key = 'test';
    const value = { data: 'my-data' };
    localStorageService.setValue(key, value);
    const result = localStorageService.getValue(key);
    expect(result).toEqual(value);
  });

  it('should return null for non-existent key', () => {
    const result = localStorageService.getValue('non-existent');
    expect(result).toBeNull();
  });

  it('should remove an item', () => {
    const key = 'test-remove';
    const value = 'to-be-removed';
    localStorageService.setValue(key, value);
    localStorageService.removeItem(key);
    const result = localStorageService.getValue(key);
    expect(result).toBeNull();
  });

  it('should clear all namespaced items', () => {
    localStorageService.setValue('test1', 'data1');
    localStorageService.setValue('test2', 'data2');
    window.localStorage.setItem('outside-namespace', 'other-data');

    localStorageService.clearAll();

    expect(localStorageService.getValue('test1')).toBeNull();
    expect(localStorageService.getValue('test2')).toBeNull();
    expect(window.localStorage.getItem('outside-namespace')).toBe('other-data');
  });

  it('should calculate usage percentage', () => {
    localStorageService.setValue('test-usage', 'some data to calculate size');
    const usage = localStorageService.getUsagePercentage();
    expect(usage).toBeGreaterThan(0);
    expect(usage).toBeLessThan(100);
  });

  it('should notify when quota is exceeded', () => {
    const callback = vi.fn();
    localStorageService.onQuotaExceeded(callback);

    // Mock a large value to trigger the quota check
    const largeValue = 'a'.repeat(5 * 1024 * 1024); // 5MB string

    // Temporarily mock setItem to throw a QuotaExceededError
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      const error = new DOMException('Quota exceeded', 'QuotaExceededError');
      throw error;
    });

    localStorageService.setValue('large-data', largeValue);

    expect(callback).toHaveBeenCalled();

    // Restore original setItem
    window.localStorage.setItem = originalSetItem;
  });

  it('should migrate data if version is old', async () => {
    // Set up old version data
    window.localStorage.setItem('npp.data-version', '0.9');
    window.localStorage.setItem('npp.old-data', 'some-old-data');

    // Re-initialize the service to trigger the version check
    vi.resetModules();
    await import('./localStorage');

    // Check that old data is cleared and new version is set
    expect(window.localStorage.getItem('npp.old-data')).toBeNull();
    // It's now stored as a JSON string
    expect(window.localStorage.getItem('npp.data-version')).toBe(
      JSON.stringify('1.0'),
    );
  });
});
