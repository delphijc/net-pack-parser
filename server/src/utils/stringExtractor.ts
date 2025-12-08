import { v4 as uuidv4 } from 'uuid';

export interface ExtractedString {
    id: string;
    type: 'IP' | 'URL' | 'Email' | 'Credential' | 'FilePath' | 'Other';
    value: string;
    packetId: string;
    payloadOffset: number;
    length: number;
}

// Regex patterns (Same as client)
const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
// const IPV6_REGEX = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g; // Simplified for now, often matches random hex
const URL_REGEX = /(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CREDENTIAL_REGEX = /\b(?:user(?:name)?|pass(?:word)?|api_key|token|auth|bearer|secret)(?:[=\s:]+)?['"]?([A-Z0-9._%+-]+)['"]?\b/gi;
const FILE_PATH_REGEX = /(?:[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]+)|(?:(?:\/[^/ ]*)+\/?)/g;

const MIN_PRINTABLE_STRING_LENGTH = 4;

export function extractStringsFromBuffer(
    payload: Buffer,
    packetId: string,
    payloadOffset: number = 0
): ExtractedString[] {
    const extracted: ExtractedString[] = [];
    // Convert buffer to string, replacing non-printable/invalid chars might be safer for regex
    // But 'utf-8' decode is standard
    const payloadString = payload.toString('utf-8');

    const addExtracted = (
        type: ExtractedString['type'],
        value: string,
        index: number,
        length: number,
    ) => {
        if (!extracted.some(e => e.value === value && e.payloadOffset === payloadOffset + index)) {
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

    // 1. Regex-based
    const extractWithRegex = (regex: RegExp, type: ExtractedString['type']) => {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(payloadString)) !== null) {
            const valueToExtract = (type === 'Credential' && match[1]) ? match[1] : match[0];
            const index = (type === 'Credential' && match[1]) ? match.index + match[0].indexOf(match[1]) : match.index;

            if (valueToExtract && valueToExtract.length >= MIN_PRINTABLE_STRING_LENGTH) {
                addExtracted(type, valueToExtract, index, valueToExtract.length);
            }
        }
    };

    extractWithRegex(IPV4_REGEX, 'IP');
    extractWithRegex(URL_REGEX, 'URL');
    extractWithRegex(EMAIL_REGEX, 'Email');
    extractWithRegex(CREDENTIAL_REGEX, 'Credential');
    // extractWithRegex(FILE_PATH_REGEX, 'FilePath'); // Too noisy usually, enable if needed

    // 2. Printable Strings
    // Basic loop for printable chars
    let currentString = '';
    let startIndex = -1;

    for (let i = 0; i < payload.length; i++) {
        const byte = payload[i];
        if (byte >= 0x20 && byte <= 0x7e) {
            if (startIndex === -1) startIndex = i;
            currentString += String.fromCharCode(byte);
        } else {
            if (currentString.length >= MIN_PRINTABLE_STRING_LENGTH) {
                // Optimization: Don't add if we already found it via regex logic? 
                // Or just add as 'Other'
                addExtracted('Other', currentString, startIndex, currentString.length);
            }
            currentString = '';
            startIndex = -1;
        }
    }
    if (currentString.length >= MIN_PRINTABLE_STRING_LENGTH) {
        addExtracted('Other', currentString, startIndex, currentString.length);
    }

    return extracted;
}
