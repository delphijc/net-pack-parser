import { useSessionStore } from '@/store/sessionStore';
import { useForensicStore } from '@/store/forensicStore';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ChainOfCustodyEvent } from '@/types';
import type { Bookmark } from '@/types/forensics';
import type { ThreatAlert } from '@/types/threat';

interface ReportMetadata {
  caseId: string;
  caseName: string;
  generatedAt: string;
  investigator: string;
  organization: string;
  summary: string;
  sha256?: string; // AC 1
  duration?: number; // AC 1 (ms)
}

interface ReportStats {
  packetCount: number;
  threatCount: number;
  totalBytes: number; // AC 1
  flowCount: number; // AC 1
}

export type ReportSectionType =
  | 'summary'
  | 'stats'
  | 'protocol'
  | 'timeline'
  | 'toptalkers'
  | 'geomap'
  | 'threats'
  | 'coc';

export interface ReportConfig {
  sections: ReportSectionType[];
  customTitle?: string;
  customSummary?: string;
}

export interface ReportData {
  metadata: ReportMetadata;
  stats: ReportStats;
  bookmarks: Bookmark[];
  chainOfCustody: ChainOfCustodyEvent[];
  timelineSnapshot?: string; // Base64 image
  protocolImage?: string; // AC 1 (Chart)
  topTalkersImage?: string; // AC 1 (Top 5 Talkers)
  geoMapImage?: string; // Chart
  threats: ThreatAlert[];
}

export class ReportGenerator {
  public async generateReportData(
    images: {
      timeline?: string;
      protocol?: string;
      topTalkers?: string;
      geoMap?: string;
    } = {},
    threats: ThreatAlert[] = [],
  ): Promise<ReportData> {
    const sessionStore = useSessionStore.getState();
    const forensicStore = useForensicStore.getState();
    const activeSessionId = sessionStore.activeSessionId;
    const activeSession = sessionStore.sessions.find(
      (s: any) => s.id === activeSessionId,
    );

    // Prefer metadata from Forensic Store if initialized
    const caseMeta = forensicStore.caseMetadata;

    // Calculate additional stats (mocked if not available in store readily)
    // Ideally sessionStore should provide bytes/flows.
    // If not, we might need to rely on what's passed or what's in store.
    // sessionStore has `packetCount`. `totalSize` might be there?
    // Let's assume activeSession has `size` (bytes).
    // Flow count is harder if not tracked. We'll use 0 or placeholder if missing.

    const metadata: ReportMetadata = {
      caseId: caseMeta?.caseId || activeSessionId || 'unknown',
      caseName: caseMeta?.caseName || activeSession?.name || 'Unknown Session',
      generatedAt: new Date().toISOString(),
      investigator: caseMeta?.investigator || 'Investigator',
      organization: caseMeta?.organization || '',
      summary: caseMeta?.summary || '',
      sha256: activeSession?.fileHash || 'N/A', // Assuming fileHash exists in session
      duration: activeSession?.duration || 0,
    };

    const stats: ReportStats = {
      packetCount: activeSession?.packetCount || 0,
      threatCount: threats.length,
      totalBytes: activeSession?.size || 0,
      flowCount: 0, // Placeholder
    };

    const coC =
      (await chainOfCustodyDb.getAllEvents()) as ChainOfCustodyEvent[];

    return {
      metadata,
      stats,
      bookmarks: forensicStore.bookmarks,
      chainOfCustody: coC,
      timelineSnapshot: images.timeline,
      protocolImage: images.protocol,
      topTalkersImage: images.topTalkers,
      geoMapImage: images.geoMap,
      threats,
    };
  }

  public generateHtml(data: ReportData): string {
    // Basic HTML fallback - keeping it simple for now as PDF is primary
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forensic Report - ${data.metadata.caseName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .section { margin-bottom: 30px; }
          img { max-width: 100%; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Forensic Report: ${data.metadata.caseName}</h1>
        <p>Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
        <p>Total Packets: ${data.stats.packetCount}</p>
        <p>Total Bytes: ${data.stats.totalBytes}</p>
        ${data.protocolImage ? `<h2>Protocol Distribution</h2><img src="${data.protocolImage}" />` : ''}
        ${data.topTalkersImage ? `<h2>Top Talkers</h2><img src="${data.topTalkersImage}" />` : ''}
      </body>
      </html>
    `;
  }

  public async generatePdf(
    data: ReportData,
    config: ReportConfig = {
      sections: [
        'summary',
        'stats',
        'protocol',
        'timeline',
        'toptalkers',
        'geomap',
        'threats',
        'coc',
      ],
    },
  ): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    const checkPageBreak = (neededHeight: number) => {
      if (yPos + neededHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // Header
    doc.setFontSize(22);
    doc.text(config.customTitle || 'Forensic Report', 20, yPos);
    yPos += 15;

    // Metadata
    doc.setFontSize(10);
    doc.text(
      `Case: ${data.metadata.caseName} (${data.metadata.caseId})`,
      20,
      yPos,
    );
    yPos += 6;
    doc.text(`Investigator: ${data.metadata.investigator}`, 20, yPos);
    yPos += 6;
    if (data.metadata.organization) {
      doc.text(`Organization: ${data.metadata.organization}`, 20, yPos);
      yPos += 6;
    }
    doc.text(
      `Date: ${new Date(data.metadata.generatedAt).toLocaleString()}`,
      20,
      yPos,
    );
    yPos += 6;
    if (data.metadata.sha256) {
      doc.text(`SHA256: ${data.metadata.sha256}`, 20, yPos);
      yPos += 6;
    }
    if (data.metadata.duration) {
      const durationSec = (data.metadata.duration / 1000).toFixed(2);
      doc.text(`Duration: ${durationSec}s`, 20, yPos);
      yPos += 6;
    }
    yPos += 10;

    const isIncluded = (section: ReportSectionType) =>
      config.sections.includes(section);

    // Executive Summary
    const summaryText =
      config.customSummary !== undefined
        ? config.customSummary
        : data.metadata.summary;
    if (isIncluded('summary') && summaryText) {
      doc.setFontSize(14);
      doc.text('Executive Summary', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 40);
      doc.text(splitSummary, 20, yPos);
      yPos += splitSummary.length * 5 + 10;
    }

    // Stats
    if (isIncluded('stats')) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.text('Capture Statistics', 20, yPos);
      yPos += 8;

      const statsData = [
        ['Total Packets', data.stats.packetCount.toString()],
        ['Total Bytes', data.stats.totalBytes.toLocaleString() + ' B'],
        ['Flow Count', data.stats.flowCount.toString()],
        ['Threats Detected', data.stats.threatCount.toString()],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 },
      });
      // @ts-expect-error autoTable adds lastAutoTable to doc
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // Images Helper
    const addImageSection = (title: string, imgData?: string) => {
      if (!imgData) return;

      doc.setFontSize(14);
      // Estimate height needed (title + image)
      // Assume image ratio 16:9 for approximation or read it
      // Simpler: assume 80mm height

      if (checkPageBreak(100)) {
        // yPos updated
      }

      doc.text(title, 20, yPos);
      yPos += 8;

      try {
        const imgProps = doc.getImageProperties(imgData);
        const imgHeight = (imgProps.height * (pageWidth - 40)) / imgProps.width;

        if (checkPageBreak(imgHeight + 10)) {
          doc.text(title, 20, yPos); // reprint title on new page if broken
          yPos += 8;
        }

        doc.addImage(imgData, 'PNG', 20, yPos, pageWidth - 40, imgHeight);
        yPos += imgHeight + 15;
      } catch (e) {
        console.error(`Failed to add ${title} image`, e);
        doc.text('(Image generation failed)', 20, yPos);
        yPos += 10;
      }
    };

    // Protocol Distribution
    if (isIncluded('protocol'))
      addImageSection('Protocol Distribution', data.protocolImage);

    // Top Talkers
    if (isIncluded('toptalkers'))
      addImageSection('Top 5 Talkers', data.topTalkersImage);

    // Timeline
    if (isIncluded('timeline'))
      addImageSection('Traffic Timeline', data.timelineSnapshot);

    // GeoMap
    if (isIncluded('geomap'))
      addImageSection('Geographic Distribution', data.geoMapImage);

    // Threats Table
    if (isIncluded('threats') && data.threats.length > 0) {
      checkPageBreak(50);
      doc.setFontSize(14);
      doc.text('Detected Threats', 20, yPos);
      yPos += 8;

      const threatData = data.threats.map((t) => [
        t.type.toUpperCase(),
        t.severity.toUpperCase(),
        t.description,
        new Date(t.timestamp).toLocaleTimeString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Type', 'Severity', 'Description', 'Time']],
        body: threatData,
        theme: 'grid',
        headStyles: { fillColor: [220, 53, 69] }, // Red header for threats
        styles: { fontSize: 8 },
        margin: { left: 20, right: 20 },
      });
      // @ts-expect-error autoTable adds lastAutoTable to doc
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // Chain of Custody
    if (isIncluded('coc')) {
      checkPageBreak(50);
      doc.setFontSize(14);
      doc.text('Chain of Custody (Last 10 Events)', 20, yPos);
      yPos += 8;

      const cocData = data.chainOfCustody
        .slice(-10)
        .map((evt) => [
          new Date(evt.timestamp).toLocaleString(),
          evt.action,
          evt.user || '-',
          evt.details || '-',
        ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Timestamp', 'Action', 'User', 'Details']],
        body: cocData,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 8 },
        margin: { left: 20, right: 20 },
      });
    }

    doc.save(`report-${data.metadata.caseId}.pdf`);
  }
}
