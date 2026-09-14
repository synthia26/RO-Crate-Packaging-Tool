import './style.css';
import { createInitialState } from './state.js';
import {
  isFileSystemAccessSupported,
  pickSourceDirectory,
  pickOutputDirectory,
  listTopLevelPdfFiles,
  writeCrateToDirectory,
} from './fileSystemAccess.js';
import { extractPdfMetadata } from './pdfMetadata.js';
import { sha256Hex } from './checksum.js';
import { buildCrate } from './crateBuilder.js';
import {
  renderShell,
  renderPdfEntries,
  setStatus,
  setSectionsEnabled,
  setGenerateEnabled,
  focusCollectionField,
  scrollToTop,
} from './ui.js';

const REQUIRED_COLLECTION_FIELDS = [
  { field: 'name', label: 'Collection name' },
  { field: 'description', label: 'Collection description' },
  { field: 'license', label: 'Collection license' },
  { field: 'datePublished', label: 'Collection date published' },
];

const state = createInitialState();

const root = document.getElementById('app');
renderShell(
  root,
  {
    onSelectSource: handleSelectSource,
    onGenerate: handleGenerate,
    onCollectionChange: (field, value) => {
      state.collection[field] = value;
    },
  },
  state.collection
);

if (!isFileSystemAccessSupported()) {
  setStatus(
    'This browser does not support the File System Access API. Please use a recent Chromium-based browser (e.g. Chrome or Edge).',
    'error'
  );
}

async function handleSelectSource() {
  let dirHandle;
  try {
    dirHandle = await pickSourceDirectory();
  } catch (err) {
    setStatus(`Could not open the folder picker: ${err.message}`, 'error');
    scrollToTop();
    return;
  }

  if (!dirHandle) {
    setStatus('Folder selection was cancelled.', 'info');
    scrollToTop();
    return;
  }

  setStatus('Scanning folder for PDF files…', 'info');

  let entries;
  try {
    entries = await listTopLevelPdfFiles(dirHandle);
  } catch (err) {
    setStatus(`Failed to read the selected folder: ${err.message}`, 'error');
    scrollToTop();
    return;
  }

  if (entries.length === 0) {
    state.files = [];
    renderPdfEntries(state.files, handleFileFieldChange);
    setSectionsEnabled(false);
    setGenerateEnabled(false);
    setStatus('No PDF files were found in the selected folder.', 'error');
    scrollToTop();
    return;
  }

  setStatus(`Found ${entries.length} PDF file(s). Extracting metadata…`, 'info');

  const files = [];
  for (const { name, file } of entries) {
    const extracted = await extractPdfMetadata(file);

    let sha256;
    try {
      sha256 = await sha256Hex(file);
    } catch (err) {
      console.warn(`Could not compute checksum for "${name}":`, err);
    }

    files.push({
      name,
      file,
      title: extracted.title || name.replace(/\.pdf$/i, ''),
      author: extracted.author || '',
      date: extracted.date || '',
      description: extracted.description || '',
      sha256,
    });
  }

  state.files = files;
  renderPdfEntries(state.files, handleFileFieldChange);
  setSectionsEnabled(true);
  setGenerateEnabled(true);
  setStatus(
    `Loaded ${files.length} PDF file(s). Review the metadata below, then generate the RO-Crate.`,
    'success'
  );
  scrollToTop();
}

function handleFileFieldChange(index, field, value) {
  state.files[index][field] = value;
}

function validateCollection(collection) {
  for (const { field, label } of REQUIRED_COLLECTION_FIELDS) {
    if (!collection[field] || !collection[field].trim()) {
      return { field, message: `${label} is required before generating the RO-Crate.` };
    }
  }
  return null;
}

async function handleGenerate() {
  if (state.files.length === 0) {
    setStatus('Generation is not available until PDF files are loaded.', 'error');
    scrollToTop();
    return;
  }

  const validationError = validateCollection(state.collection);
  if (validationError) {
    setStatus(validationError.message, 'error');
    focusCollectionField(validationError.field);
    scrollToTop();
    return;
  }

  let outputDirHandle;
  try {
    outputDirHandle = await pickOutputDirectory();
  } catch (err) {
    setStatus(`Could not open the output folder picker: ${err.message}`, 'error');
    scrollToTop();
    return;
  }

  if (!outputDirHandle) {
    setStatus('Output folder selection was cancelled.', 'info');
    scrollToTop();
    return;
  }

  setStatus('Generating RO-Crate…', 'info');

  try {
    const crate = buildCrate({ collection: state.collection, files: state.files });
    const metadataJson = JSON.stringify(crate, null, 2);

    await writeCrateToDirectory(outputDirHandle, {
      metadataJson,
      files: state.files.map(({ name, file }) => ({ name, file })),
    });

    setStatus(
      `RO-Crate generated successfully with ${state.files.length} PDF file(s).`,
      'success'
    );
  } catch (err) {
    setStatus(`Failed to generate the RO-Crate: ${err.message}`, 'error');
  }

  scrollToTop();
}
