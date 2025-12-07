import { useSessionStore } from '@/store/sessionStore';
import { useForensicStore } from '@/store/forensicStore';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';
import jsPDF from 'jspdf';
import type { ChainOfCustodyEvent } from '@/types';
import type { Bookmark } from '@/types/forensics';

interface ReportMetadata {
  caseId: string;
  caseName: string;
  generatedAt: string;
  investigator: string;
}

interface ReportStats {
  packetCount: number;
  threatCount: number;
}

export interface ReportData {
  metadata: ReportMetadata;
  stats: ReportStats;
  bookmarks: Bookmark[];
  chainOfCustody: ChainOfCustodyEvent[];
  timelineSnapshot?: string; // Base64 image
}

export class ReportGenerator {
  public async generateReportData(timelineSnapshot?: string): Promise<ReportData> {
    const sessionStore = useSessionStore.getState();
    const forensicStore = useForensicStore.getState();
    const activeSessionId = sessionStore.activeSessionId;
    const activeSession = sessionStore.sessions.find((s: any) => s.id === activeSessionId);

    const metadata: ReportMetadata = {
      caseId: activeSessionId || 'unknown',
      caseName: activeSession?.name || 'Unknown Session',
      generatedAt: new Date().toISOString(),
      investigator: 'Investigator' // TODO: Get from user profile
    };

    const stats: ReportStats = {
      packetCount: activeSession?.packetCount || 0,
      threatCount: 0 // Placeholder
    };

    const coC = (await chainOfCustodyDb.getAllEvents()) as ChainOfCustodyEvent[];

    return {
      metadata,
      stats,
      bookmarks: forensicStore.bookmarks,
      chainOfCustody: coC,
      timelineSnapshot
    };
  }

  public generateHtml(data: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forensic Report - ${data.metadata.caseName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1, h2 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
          .metadata { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
          th { background-color: #f1f1f1; }
          .snapshot img { max-width: 100%; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Forensic Report</h1>
        <div class="metadata">
          <p><strong>Case Name:</strong> ${data.metadata.caseName}</p>
          <p><strong>Case ID:</strong> ${data.metadata.caseId}</p>
          <p><strong>Investigator:</strong> ${data.metadata.investigator}</p>
          <p><strong>Date:</strong> ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
        </div>

        <div class="section">
          <h2>Summary Statistics</h2>
          <table style="width: auto;">
            <tr><td>Total Packets</td><td>${data.stats.packetCount}</td></tr>
            <tr><td>Threats Detected</td><td>${data.stats.threatCount}</td></tr>
          </table>
        </div>

        ${data.timelineSnapshot ? `
        <div class="section snapshot">
          <h2>Timeline Visualization</h2>
          <img src="${data.timelineSnapshot}" alt="Timeline Snapshot" />
        </div>
        ` : ''}

        <div class="section">
          <h2>Annotations & Bookmarks</h2>
          ${data.bookmarks.length > 0 ? `
            <table>
              <tr><th>Timestamp</th><th>Note</th></tr>
              ${data.bookmarks.map((bm: Bookmark) => `
                <tr>
                  <td>${new Date(bm.timestamp).toLocaleString()}</td>
                  <td>${bm.note}</td>
                </tr>
              `).join('')}
            </table>
          ` : '<p>No annotations recorded.</p>'}
        </div>

        <div class="section">
          <h2>Chain of Custody Log</h2>
          <table>
            <tr><th>Timestamp</th><th>Action</th><th>User</th><th>Details</th></tr>
            ${data.chainOfCustody.map((evt) => `
              <tr>
                <td>${evt.timestamp}</td>
                <td>${evt.action}</td>
                <td>${evt.user || '-'}</td>
                <td>${evt.details || '-'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;
  }

  public async generatePdf(data: ReportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.text('Forensic Report', 20, yPos);
    yPos += 15;

    // Metadata
    doc.setFontSize(12);
    doc.text(`Case: ${data.metadata.caseName}`, 20, yPos); yPos += 7;
    doc.text(`ID: ${data.metadata.caseId}`, 20, yPos); yPos += 7;
    doc.text(`Date: ${new Date(data.metadata.generatedAt).toLocaleString()}`, 20, yPos); yPos += 15;

    // Stats
    doc.setFontSize(16);
    doc.text('Summary', 20, yPos); yPos += 10;
    doc.setFontSize(12);
    doc.text(`Total Packets: ${data.stats.packetCount}`, 20, yPos); yPos += 7;
    doc.text(`Threats: ${data.stats.threatCount}`, 20, yPos); yPos += 15;

    // Timeline Snapshot (if available)
    if (data.timelineSnapshot) {
      doc.setFontSize(16);
      doc.text('Timeline', 20, yPos); yPos += 10;
      try {
        const imgProps = doc.getImageProperties(data.timelineSnapshot);
        const imgHeight = (imgProps.height * (pageWidth - 40)) / imgProps.width;
        doc.addImage(data.timelineSnapshot, 'PNG', 20, yPos, pageWidth - 40, imgHeight);
        yPos += imgHeight + 10;
      } catch (e) {
        console.error('Failed to add timeline image to PDF', e);
      }
    }

    // Checking space for next sections...
    if (yPos > 250) { doc.addPage(); yPos = 20; }

    // CoC (Simplified for now - can use autoTable for better layout)
    doc.setFontSize(16);
    doc.text('Chain of Custody (Last 10 Events)', 20, yPos); yPos += 10;
    doc.setFontSize(10);
    data.chainOfCustody.slice(-10).forEach(evt => {
      if (yPos > 280) { doc.addPage(); yPos = 20; }
      doc.text(`${evt.timestamp} | ${evt.action} | ${evt.details}`, 20, yPos);
      yPos += 6;
    });

    doc.save(`report-${data.metadata.caseId}.pdf`);
  }
}
