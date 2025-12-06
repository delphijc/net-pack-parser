// client/src/utils/stringExtractorCore.ts

import type { ExtractedString } from '../types/extractedStrings';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// Regex patterns for various string types
const IPV4_REGEX =
  /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
const IPV6_REGEX = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g;
const URL_REGEX = /(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CREDENTIAL_REGEX =
  /\b(?:user(?:name)?|pass(?:word)?|api_key|token|auth|bearer|secret)(?:[=\s:]+)?['"]?([A-Z0-9._%+-]+)['"]?\b/gi;
const FILE_PATH_REGEX = new RegExp(
  '(?:[a-zA-Z]:\\\\(?:[^\\\\/:*?"<>|\\r\\n]+\\\\)*[^\\\\/:*?"<>|\\r\\n]+)|(?:(?:\\/[^/ ]*)+\\/?)',
  'g',
);

const MIN_PRINTABLE_STRING_LENGTH = 4;

/**
 * Extracts various types of strings (IPs, URLs, Emails, Credentials, File Paths, printable ASCII)
 * from a given ArrayBuffer payload.
 *
 * @param payload The ArrayBuffer containing the packet payload.
 * @param packetId The ID of the packet this payload belongs to.
 * @param payloadOffset The starting offset of the payload within the original packet data.
 * @returns An array of ExtractedString objects.
 */
export function extractStringsFromBuffer(
  payload: ArrayBuffer,
  packetId: string,
  payloadOffset: number,
): ExtractedString[] {
  const extracted: ExtractedString[] = [];
  const payloadUint8 = new Uint8Array(payload);
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const payloadString = textDecoder.decode(payloadUint8);

  const addExtracted = (
    type: ExtractedString['type'],
    value: string,
    index: number,
    length: number,
  ) => {
    // Check for duplicates to avoid adding the same string found by multiple regexes or printable string logic
    if (
      !extracted.some(
        (e) => e.value === value && e.payloadOffset === payloadOffset + index,
      )
    ) {
      extracted.push({
        id: uuidv4(),
        type,
        value,
        packetId,
        payloadOffset: payloadOffset + index,
        length,
      });
    }
  };

  // 1. Regex-based extractions
  const extractWithRegex = (regex: RegExp, type: ExtractedString['type']) => {
    regex.lastIndex = 0; // Reset lastIndex for global regexes
    let match;
    while ((match = regex.exec(payloadString)) !== null) {
      if (match[0]) {
        // Use match[0] for the full matched string.
        // For CREDENTIAL_REGEX, if a capturing group is used for the value, match[1] might be more specific.
        // For simplicity, sticking to match[0] for now, and will refine CREDENTIAL_REGEX if needed.
        const valueToExtract =
          type === 'Credential' && match[1] ? match[1] : match[0];
        const index =
          type === 'Credential' && match[1]
            ? match.index + match[0].indexOf(match[1])
            : match.index;
        const length = valueToExtract.length;

        addExtracted(type, valueToExtract, index, length);
      }
    }
  };

  extractWithRegex(IPV4_REGEX, 'IP');
  extractWithRegex(IPV6_REGEX, 'IP');
  extractWithRegex(URL_REGEX, 'URL');
  extractWithRegex(EMAIL_REGEX, 'Email');
  extractWithRegex(CREDENTIAL_REGEX, 'Credential');
  extractWithRegex(FILE_PATH_REGEX, 'FilePath');

  // 2. Printable ASCII string extraction
  let currentString = '';
  let startIndex = -1;

  const addPrintableString = (str: string, strStartIndex: number) => {
    // First, add the full string if it's long enough
    if (str.length >= MIN_PRINTABLE_STRING_LENGTH) {
      addExtracted('Other', str, strStartIndex, str.length);
    }

    // Then extract individual "interesting" words - those containing underscores, numbers, or other non-letter chars
    let searchFrom = 0;
    const words = str.split(/\s+/);

    for (const word of words) {
      if (word.length >= MIN_PRINTABLE_STRING_LENGTH) {
        // Only extract words that have underscores, numbers, or other special chars
        // This helps identify identifiers, codes, etc. while filtering out plain English words
        if (/[_0-9]/.test(word)) {
          const wordIndex = str.indexOf(word, searchFrom);
          if (wordIndex >= 0) {
            addExtracted('Other', word, strStartIndex + wordIndex, word.length);
            searchFrom = wordIndex + word.length;
          }
        } else {
          // Still update searchFrom even if not extracting
          const wordIndex = str.indexOf(word, searchFrom);
          if (wordIndex >= 0) {
            searchFrom = wordIndex + word.length;
          }
        }
      } else {
        // Update searchFrom to skip past short words
        const wordIndex = str.indexOf(word, searchFrom);
        if (wordIndex >= 0) {
          searchFrom = wordIndex + word.length;
        }
      }
    }
  };

  for (let i = 0; i < payloadUint8.length; i++) {
    const byte = payloadUint8[i];
    // Check if the byte is a printable ASCII character (0x20 to 0x7E)
    if (byte >= 0x20 && byte <= 0x7e) {
      if (startIndex === -1) {
        startIndex = i;
      }
      currentString += String.fromCharCode(byte);
    } else {
      if (currentString.trim().length > 0) {
        addPrintableString(currentString, startIndex);
      }
      currentString = '';
      startIndex = -1;
    }
  }

  // Add any trailing printable string
  if (currentString.trim().length > 0) {
    addPrintableString(currentString, startIndex);
  }

  return extracted;
}
