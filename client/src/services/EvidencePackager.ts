import JSZip from 'jszip';
import { useForensicStore } from '@/store/forensicStore';
import { useSessionStore } from '@/store/sessionStore';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';
import { generateSha256Hash } from '@/utils/hashGenerator';

export class EvidencePackager {
    /**
     * Generates and downloads a forensic evidence package (ZIP).
     * @param pcapBlob The original PCAP file blob.
     * @param filename The original filename.
     */
    public async exportPackage(pcapBlob: Blob, filename: string): Promise<string> {
        const zip = new JSZip();

        // 1. Add Original PCAP
        zip.file('evidence.pcap', pcapBlob);

        // 2. Collect Metadata
        let session = useSessionStore.getState().sessions.find(s => s.id === useSessionStore.getState().activeSessionId);
        const storedMetadata = useForensicStore.getState().caseMetadata;

        if (!session) {
            // Fallback if no active session found (e.g. direct parse)
            session = {
                id: 'unknown',
                name: filename,
                timestamp: Date.now(),
                packetCount: 0
            };
        }

        const caseMetadata = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            originalFilename: filename,
            caseId: storedMetadata?.caseId || session.id,
            caseName: storedMetadata?.caseName || session.name,
            investigator: storedMetadata?.investigator || 'Analyst',
            organization: storedMetadata?.organization || '',
            summary: storedMetadata?.summary || '',
            session: session,
            system: {
                userAgent: navigator.userAgent,
                platform: navigator.platform
            }
        };
        zip.file('case-metadata.json', JSON.stringify(caseMetadata, null, 2));

        // 3. Add Chain of Custody Log
        const cocEvents = await chainOfCustodyDb.getAllEvents();
        zip.file('chain-of-custody.json', JSON.stringify(cocEvents, null, 2));

        // 4. Add Annotations
        const bookmarks = useForensicStore.getState().bookmarks;
        zip.file('annotations.json', JSON.stringify(bookmarks, null, 2));

        // 5. Generate ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // 6. Calculate Hash of ZIP
        const arrayBuffer = await zipBlob.arrayBuffer();
        const zipHash = await generateSha256Hash(arrayBuffer);

        // 7. Add Hash File
        // We can't add the hash of the zip INSIDE the zip (circular dependency).
        // The AC says "System offers to download a separate .sha256 text file or displays the hash".
        // We will display it in the UI, and maybe trigger a download of the .sha256 file separately.
        // However, for the package itself, users often expect the hash to be of the package.

        // Trigger download of the ZIP
        const packageFilename = `evidence-package-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
        // We need file-saver or just create element
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = packageFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Trigger download of the Hash file
        const hashFilename = `${packageFilename}.sha256`;
        const hashBlob = new Blob([`${zipHash}  ${packageFilename}`], { type: 'text/plain' });
        const hashUrl = URL.createObjectURL(hashBlob);
        const hashLink = document.createElement('a');
        hashLink.href = hashUrl;
        hashLink.download = hashFilename;
        document.body.appendChild(hashLink);
        hashLink.click();
        document.body.removeChild(hashLink);
        URL.revokeObjectURL(hashUrl);

        return zipHash;
    }
}

export const evidencePackager = new EvidencePackager();
