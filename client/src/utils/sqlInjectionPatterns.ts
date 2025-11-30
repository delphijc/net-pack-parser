// client/src/utils/sqlInjectionPatterns.ts

/**
 * Regex patterns for detecting various SQL Injection techniques.
 * These patterns are designed to be used after appropriate decoding (URL-decode, hex-decode)
 * of the input string, as some patterns might be obfuscated.
 */

export const sqlInjectionPatterns = {
  /**
   * Classic SQL Injection patterns, often involving quotes to break out of string literals.
   */
  classic: [
    // Basic ' OR '1'='1' style patterns
    /'\s*OR\s+'?\d+'?='?\d+/g,
    /'\s*OR\s+'?TRUE'?/g,
    /'\s*OR\s+'?FALSE'?/g,
    // Union-based injection
    /UNION(?:\s+ALL)?\s+SELECT(?:\s+\w+)?/gi,
    // Error-based injection
    /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\s*FROM\s+.*?\s*WHERE\s+.*?CAST\s*\(\s*.*?AS\s*\w+\s*\)/gi,
    // Stacked queries (typically ';') - may indicate command chaining
    /;\s*(?:DROP|ALTER|CREATE)\s+(?:TABLE|DATABASE|SCHEMA|VIEW)/gi,
    // Comments to bypass trailing query parts
    /'\s*(?:--|#|\/\*)/g,
    /;\s*(?:--|#|\/\*)/g,
  ],

  /**
   * Time-based blind SQL Injection patterns, causing delays based on conditions.
   */
  timeBased: [
    /WAITFOR\s+DELAY\s+'\d{2}:\d{2}:\d{2}'/gi, // SQL Server
    /PG_SLEEP\s*\(\s*\d+\s*\)/gi, // PostgreSQL
    /SLEEP\s*\(\s*\d+\s*\)/gi, // MySQL
    /BENCHMARK\s*\(\s*\d+,\s*MD5\s*\(\s*['"]?\w+['"]?\s*\)\s*\)/gi, // MySQL CPU-intensive
  ],

  /**
   * Boolean-based blind SQL Injection patterns, where true/false conditions affect output.
   */
  booleanBased: [
    /AND\s+'?\d+'?='?\d+/gi, // AND 1=1, AND '1'='1'
    /OR\s+'?\d+'?='?\d+/gi, // OR 1=1, OR 1=2
    /AND\s+(?:TRUE|FALSE)/gi,
    /OR\s+(?:TRUE|FALSE)/gi,
  ],

  /**
   * Encoded patterns need to be decoded first. These patterns are for use AFTER decoding.
   */
  // Example for if decoding happens elsewhere:
  // urlEncoded: [], // Actual patterns would be in classic, timeBased, booleanBased
  // hexEncoded: [], // Actual patterns would be in classic, timeBased, booleanBased
};

/**
 * Utility function to decode URL-encoded strings.
 * @param {string} input - The string to decode.
 * @returns {string} The URL-decoded string.
 */
export function decodeUrl(input: string): string {
  try {
    return decodeURIComponent(input.replace(/\+/g, ' '));
  } catch {
    // If decoding fails, return original to avoid loss of data and continue pattern matching
    return input;
  }
}

/**
 * Utility function to decode hex-encoded strings.
 * @param {string} input - The string to decode.
 * @returns {string} The hex-decoded string.
 */
export function decodeHex(input: string): string {
  // Check if the input looks like a hex string (e.g., %73%65%6c%65%63%74 or 0x73656c656374)
  // This is a simplistic check; real-world scenarios might need more robust validation.
  if (input.startsWith('0x')) {
    input = input.substring(2);
  }
  if (!/^[0-9a-fA-F]+$/.test(input) || input.length % 2 !== 0) {
    return input; // Not a valid hex string, return original
  }
  const hex = input.toString();
  let str = '';
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
