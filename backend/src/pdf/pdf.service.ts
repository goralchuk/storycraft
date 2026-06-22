import { Injectable, Logger } from '@nestjs/common';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';

// pdfkit's built-in fonts are Latin-only; embed a Unicode font so Cyrillic
// (Russian story text) renders. Copied into dist via nest-cli.json assets.
const FONT_PATH = join(__dirname, 'fonts', 'DejaVuSans.ttf');

export type PdfPage = {
  text: string;
  imageUrl?: string | null;
  layout?: 'IMAGE_ONLY' | 'IMAGE_TEXT' | 'TEXT_ONLY';
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
    doc.registerFont('body', FONT_PATH);
    doc.font('body');
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
      const layout = page.layout ?? 'IMAGE_TEXT';
      const img =
        layout !== 'TEXT_ONLY' && page.imageUrl
          ? await this.fetchImage(page.imageUrl)
          : null;

      if (layout === 'TEXT_ONLY' || !img) {
        // Text only (or image missing): render the text alone.
        doc.fontSize(16).text(page.text);
      } else if (layout === 'IMAGE_ONLY') {
        // Full illustration, no text.
        doc.image(img, { fit: [495, 700], align: 'center', valign: 'center' });
      } else {
        // IMAGE_TEXT: ~2/3 image, then text below.
        doc.image(img, { fit: [495, 470], align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(page.text);
      }
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
