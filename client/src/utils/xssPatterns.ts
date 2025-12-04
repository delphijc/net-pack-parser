// client/src/utils/xssPatterns.ts

/**
 * Regular expression patterns for detecting Cross-Site Scripting (XSS) attacks.
 * These patterns cover various injection vectors including script tags, event handlers,
 * and encoded payloads.
 */
export const xssPatterns = {
    // Script tags: <script>...</script>, <script src=...>
    scriptTags: [
        /<script\b[^>]*>([\s\S]*?)<\/script>/gim,
        /<script\b[^>]*>/gim,
        /<\/script>/gim,
    ],

    // Event handlers: onclick=, onmouseover=, onerror=, etc.
    // Matches on\w+= pattern, often used in HTML attributes
    eventHandlers: [
        /on\w+\s*=/gim,
        /on(?:click|load|error|mouseover|mouseout|mousedown|mouseup|mousemove|keydown|keyup|keypress|change|submit|focus|blur)\s*=/gim,
    ],

    // JavaScript URIs: javascript:alert(1)
    javascriptUris: [
        /javascript:[^"']*/gim,
    ],

    // Data URIs: data:text/html,<script>...
    dataUris: [
        /data:text\/html;base64,[^"']*/gim,
        /data:text\/html,[^"']*/gim,
    ],

    // Polyglot patterns (often used to break out of contexts)
    polyglots: [
        /javascript:\/\*.*\*\//gim, // Comment injection
        /expression\s*\(/gim, // IE CSS expression
    ],
};

/**
 * Decodes URL-encoded strings.
 * @param text The text to decode.
 * @returns The decoded text.
 */
export function decodeUrl(text: string): string {
    try {
        return decodeURIComponent(text);
    } catch (e) {
        return text;
    }
}

/**
 * Decodes HTML entities.
 * @param text The text to decode.
 * @returns The decoded text.
 */
export function decodeHtmlEntities(text: string): string {
    return text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}
