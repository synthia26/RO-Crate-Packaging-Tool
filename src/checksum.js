/**
 * Compute the SHA-256 checksum of a File as a lowercase hex string, using
 * the browser's native Web Crypto API (available in any secure context,
 * which the File System Access API already requires).
 */
export async function sha256Hex(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
