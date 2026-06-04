import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export type PdfPage = {
  text: string;
  imageUrl?: string | null;
};

export type PdfInput = {
  title: string;
  pages: PdfPage[];
};

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /** Assembles a cover + one page per spread into a single PDF buffer. */
  async generate(input: PdfInput): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Cover
    doc.fontSize(32).text(input.title, { align: 'center' });

    for (const page of input.pages) {
      doc.addPage();
      if (page.imageUrl) {
        const img = await this.fetchImage(page.imageUrl);
        if (img) {
          doc.image(img, { fit: [495, 400], align: 'center' });
          doc.moveDown();
        }
      }
      doc.fontSize(16).text(page.text);
    }

    doc.end();
    return done;
  }

  // Remote URL → Buffer for pdfkit. Returns null on any failure so a missing or
  // unsupported image never breaks PDF generation.
  private async fetchImage(url: string): Promise<Buffer | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      this.logger.warn(`Image fetch failed for ${url}: ${String(err)}`);
      return null;
    }
  }
}
