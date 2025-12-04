// client/src/utils/sensitiveDataDetector.test.ts

import { describe, it, expect } from 'vitest';
import { detectSensitiveData } from './sensitiveDataDetector';
import { validateLuhn } from './sensitiveDataPatterns';
import type { Packet } from '@/types/packet';

describe('validateLuhn', () => {
    it('should validate correct credit card numbers', () => {
        expect(validateLuhn('4532 7156 8921 3496')).toBe(true); // Valid check digit 6
        expect(validateLuhn('4532-7156-8921-3496')).toBe(true);
        expect(validateLuhn('4532715689213496')).toBe(true);
    });

    it('should reject invalid credit card numbers', () => {
        expect(validateLuhn('4532 7156 8921 3491')).toBe(false); // Invalid check digit
        expect(validateLuhn('123')).toBe(false); // Too short
    });
});

describe('detectSensitiveData', () => {
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

    it('should detect AWS Access Keys', () => {
        const rawData = 'GET /?key=AKIAIOSFODNN7EXAMPLE HTTP/1.1\r\n\r\n';
        const packet = createPacket(rawData);
        const threats = detectSensitiveData(packet);

        expect(threats).toHaveLength(1);
        expect(threats[0].type).toBe('Sensitive Data Exposure');
        expect(threats[0].severity).toBe('critical');
        expect(threats[0].description).toContain('AWS Access Key');
        expect(threats[0].description).toContain('AKIA...MPLE'); // Redacted format
        expect(threats[0].sensitiveData).toContain('AKIAIOSFODNN7EXAMPLE'); // Raw data available
    });

    it('should detect Credit Card numbers', () => {
        // Test CC: 4532 7156 8921 3496 (Valid Luhn)
        const rawData = 'POST /pay HTTP/1.1\r\n\r\ncc=4532715689213496&cvv=123';
        const packet = createPacket(rawData);
        const threats = detectSensitiveData(packet);

        expect(threats).toHaveLength(1);
        expect(threats[0].description).toContain('Credit Card Number');
        // Check redaction (first 4, last 4)
        expect(threats[0].description).toContain('4532...3496');
    });

    it('should detect SSNs', () => {
        const rawData = 'user_ssn=123-45-6789';
        const packet = createPacket(rawData);
        const threats = detectSensitiveData(packet);

        expect(threats).toHaveLength(1);
        expect(threats[0].description).toContain('SSN');
    });

    it('should detect Private Keys', () => {
        const rawData = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----';
        const packet = createPacket(rawData);
        const threats = detectSensitiveData(packet);

        expect(threats).toHaveLength(1);
        expect(threats[0].description).toContain('Private Key');
    });

    it('should not detect benign traffic', () => {
        const rawData = 'GET /search?q=hello HTTP/1.1\r\n\r\n';
        const packet = createPacket(rawData);
        const threats = detectSensitiveData(packet);

        expect(threats).toHaveLength(0);
    });
});
