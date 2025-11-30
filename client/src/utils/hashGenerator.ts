import CryptoJS from 'crypto-js';

/**
 * @fileoverview Utility functions for generating cryptographic hashes (SHA-256 and MD5) for files.
 * This service encapsulates the hashing logic to maintain file integrity and chain of custody.
 */

/**
 * Generates a SHA-256 hash of the given file content using the Web Crypto API.
 * The Web Crypto API is used for its security and browser-native implementation.
 *
 * @param {ArrayBuffer} data The file content as an ArrayBuffer.
 * @returns {Promise<string>} A promise that resolves with the SHA-256 hash as a hexadecimal string.
 */
export async function generateSha256Hash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hash = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return sha256Hash;
}

export async function generateMd5Hash(data: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(data);
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  const wordArray = CryptoJS.enc.Latin1.parse(binaryString);
  const md5Hash = CryptoJS.MD5(wordArray).toString();
  return md5Hash;
}
