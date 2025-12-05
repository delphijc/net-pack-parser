// client/src/utils/directoryTraversalPatterns.ts

/**
 * Regular expression patterns for detecting Directory Traversal attacks.
 */
export const directoryTraversalPatterns = {
  // Standard traversal: ../, ..\
  standardTraversal: [/\.\.[\/\\]/g],

  // Encoded traversal: %2e%2e%2f, %2e%2e%5c, etc.
  encodedTraversal: [
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /%252e%252e%252f/gi, // Double encoded
  ],

  // Absolute paths (Unix/Windows)
  absolutePaths: [
    /(?:\/|\\)(?:etc|bin|boot|dev|home|lib|mnt|opt|proc|root|sbin|sys|tmp|usr|var|Windows|Program Files|Users)(?:\/|\\)/gim,
    /C:\\Windows\\/gim,
  ],

  // Sensitive files
  sensitiveFiles: [
    /etc\/passwd/gim,
    /etc\/shadow/gim,
    /win\.ini/gim,
    /boot\.ini/gim,
  ],
};
