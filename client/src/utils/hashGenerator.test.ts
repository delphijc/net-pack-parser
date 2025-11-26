import { describe, it, expect } from 'vitest';
import { generateSha256Hash, generateMd5Hash } from './hashGenerator';




// Sample data and pre-calculated hashes
// Input string: "hello world"
// SHA-256 hash: b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
// MD5 hash: 5d41402abc4b2a76b9719d911017c592

const testString = 'hello world';
const testBuffer = new TextEncoder().encode(testString).buffer;

describe('hashGenerator', () => {
  it('should generate the correct SHA-256 hash for a known input', async () => {
    const expectedSha256 = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    const actualSha256 = await generateSha256Hash(testBuffer);
    expect(actualSha256).toBe(expectedSha256);
  });

  it('should generate the correct MD5 hash for a known input', async () => {
    const expectedMd5 = '5eb63bbbe01eeed093cb22bb8f5acdc3';
    const actualMd5 = await generateMd5Hash(testBuffer);
    expect(actualMd5).toBe(expectedMd5);
  });

  it('should handle empty input for SHA-256', async () => {
    const emptyBuffer = new ArrayBuffer(0);
    const expectedSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // SHA-256 of empty string
    const actualSha256 = await generateSha256Hash(emptyBuffer);
    expect(actualSha256).toBe(expectedSha256);
  });

  it('should handle empty input for MD5', async () => {
    const emptyBuffer = new ArrayBuffer(0);
    const expectedMd5 = 'd41d8cd98f00b204e9800998ecf8427e'; // MD5 of empty string
    const actualMd5 = await generateMd5Hash(emptyBuffer);
    expect(actualMd5).toBe(expectedMd5);
  });
});
