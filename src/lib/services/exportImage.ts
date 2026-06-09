// JSON image export — pure browser implementation.
// We render the live Monaco editor DOM via html-to-image; the previous Rust path
// (which rasterized JSON ourselves with the image crate) is gone.
import { toPng, toJpeg } from 'html-to-image';

export type ExportImageFormat = 'png' | 'jpeg';

interface ExportOptions {
  node: HTMLElement;
  format?: ExportImageFormat;
  pixelRatio?: number;
  backgroundColor?: string;
}

export interface ExportResult {
  blob: Blob;
  filename: string; // suggested filename without extension
  format: ExportImageFormat;
}

export async function exportNodeAsImage(
  options: ExportOptions,
  suggestedBase = 'json',
): Promise<ExportResult> {
  const { node, format = 'png', pixelRatio = 2, backgroundColor } = options;
  const dataUrl = format === 'png'
    ? await toPng(node, { pixelRatio, backgroundColor, cacheBust: true })
    : await toJpeg(node, { pixelRatio, backgroundColor, quality: 0.95, cacheBust: true });
  const blob = await dataUrlToBlob(dataUrl);
  return { blob, filename: suggestedBase, format };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revocation so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getExportImageFileName(sourceName?: string | null, ext = 'png'): string {
  const base = (sourceName || 'json').replace(/\.[^./\\]+$/, '');
  return `${base}.${ext}`;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
