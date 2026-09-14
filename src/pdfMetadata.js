import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Verified against the installed pdfjs-dist 6.3.289 build: this ?url import
// resolves cleanly under both `vite` and `vite build` without copying the
// worker file into public/.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Convert a PDF Info dictionary date string (e.g. "D:20240115103000+02'00'")
 * into YYYY-MM-DD, per SPEC.md's date normalisation rule. Returns undefined
 * if the value is missing or not in the expected format.
 */
export function parsePdfDate(raw) {
  if (typeof raw !== 'string') return undefined;
  const match = raw.match(/^D:(\d{4})(\d{2})(\d{2})/);
  if (!match) return undefined;
  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

/**
 * Extract available embedded metadata from a PDF File object.
 * Extraction failures are caught and reported as blank fields so that one
 * bad PDF does not prevent the others from loading (SPEC.md section 6).
 */
export async function extractPdfMetadata(file) {
  // `destroy()` lives on the loadingTask returned by getDocument(), not on
  // the resolved PDFDocumentProxy (`pdf.destroy` does not exist and throws).
  const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
  try {
    const pdf = await loadingTask.promise;
    const { info } = await pdf.getMetadata();
    return {
      title: info?.Title || undefined,
      author: info?.Author || undefined,
      date: parsePdfDate(info?.CreationDate),
      description: info?.Subject || undefined,
    };
  } catch (err) {
    console.warn(`Could not extract metadata from "${file.name}":`, err);
    return { title: undefined, author: undefined, date: undefined, description: undefined };
  } finally {
    await loadingTask.destroy();
  }
}
