// client/src/types/extractedStrings.ts

export type ExtractedStringType =
  | 'IP'
  | 'URL'
  | 'Email'
  | 'Credential'
  | 'FilePath'
  | 'Other';

export interface ExtractedString {
  id: string;
  type: ExtractedStringType;
  value: string;
  packetId: string;
  payloadOffset: number;
  length: number;
}
