/**
 * Thin wrapper around the browser File System Access API.
 * Verified calls: window.showDirectoryPicker(), dirHandle.entries(),
 * handle.getFile(), dirHandle.getFileHandle(name, {create}),
 * fileHandle.createWritable(), writable.write(), writable.close().
 * Cancellation surfaces as a DOMException named "AbortError".
 */

export function isFileSystemAccessSupported() {
  return typeof window.showDirectoryPicker === 'function';
}

async function pickDirectory(options) {
  try {
    return await window.showDirectoryPicker(options);
  } catch (err) {
    if (err.name === 'AbortError') return null;
    throw err;
  }
}

export function pickSourceDirectory() {
  return pickDirectory();
}

export function pickOutputDirectory() {
  return pickDirectory({ mode: 'readwrite' });
}

export async function listTopLevelPdfFiles(dirHandle) {
  const results = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file' && name.toLowerCase().endsWith('.pdf')) {
      const file = await handle.getFile();
      results.push({ name, file });
    }
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

export async function writeCrateToDirectory(dirHandle, { metadataJson, files }) {
  const metadataHandle = await dirHandle.getFileHandle('ro-crate-metadata.json', { create: true });
  const metadataWritable = await metadataHandle.createWritable();
  await metadataWritable.write(metadataJson);
  await metadataWritable.close();

  for (const { name, file } of files) {
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
  }
}
