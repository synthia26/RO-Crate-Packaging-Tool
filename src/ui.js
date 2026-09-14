let statusEl;
let collectionFieldset;
let pdfFieldset;
let pdfEntriesEl;
let generateBtn;
let selectSourceBtn;
let collectionInputs;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

export function renderShell(root, handlers, initialCollection = {}) {
  root.innerHTML = `
    <div class="app">
      <header class="app-header">
        <h1>RO-Crate PDF Packaging Tool</h1>
        <p class="subtitle">Package a folder of PDFs into an RO-Crate 1.3 dataset.</p>
      </header>

      <div id="status" class="status" role="status" aria-live="polite" hidden></div>

      <section class="panel">
        <h2>1. Source Folder</h2>
        <button id="select-source-btn" type="button" class="primary">Select source folder…</button>
      </section>

      <fieldset id="collection-fieldset" class="panel" disabled>
        <legend>2. Collection Metadata</legend>
        <div class="field">
          <label for="collection-name">Name</label>
          <input id="collection-name" type="text" />
        </div>
        <div class="field">
          <label for="collection-description">Description</label>
          <textarea id="collection-description" rows="2"></textarea>
        </div>
        <div class="field">
          <label for="collection-license">License</label>
          <input id="collection-license" type="text" placeholder="e.g. https://creativecommons.org/licenses/by/4.0/" />
        </div>
        <div class="field">
          <label for="collection-date-published">Date Published</label>
          <input id="collection-date-published" type="date" />
        </div>
      </fieldset>

      <fieldset id="pdf-fieldset" class="panel" disabled>
        <legend>3. PDF Metadata</legend>
        <div id="pdf-entries" class="pdf-entries"></div>
      </fieldset>

      <section class="panel">
        <h2>4. Generate</h2>
        <button id="generate-btn" type="button" class="primary" disabled>Select output folder &amp; generate RO-Crate</button>
      </section>
    </div>
  `;

  statusEl = root.querySelector('#status');
  collectionFieldset = root.querySelector('#collection-fieldset');
  pdfFieldset = root.querySelector('#pdf-fieldset');
  pdfEntriesEl = root.querySelector('#pdf-entries');
  generateBtn = root.querySelector('#generate-btn');
  selectSourceBtn = root.querySelector('#select-source-btn');

  collectionInputs = {
    name: root.querySelector('#collection-name'),
    description: root.querySelector('#collection-description'),
    license: root.querySelector('#collection-license'),
    datePublished: root.querySelector('#collection-date-published'),
  };

  selectSourceBtn.addEventListener('click', handlers.onSelectSource);
  generateBtn.addEventListener('click', handlers.onGenerate);

  for (const [field, input] of Object.entries(collectionInputs)) {
    input.value = initialCollection[field] || '';
    input.addEventListener('input', () => handlers.onCollectionChange(field, input.value));
  }
}

export function focusCollectionField(field) {
  collectionInputs?.[field]?.focus();
}

export function setStatus(message, level = 'info') {
  statusEl.textContent = message;
  statusEl.hidden = !message;
  statusEl.className = message ? `status status-${level}` : 'status';
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function setSectionsEnabled(enabled) {
  collectionFieldset.disabled = !enabled;
  pdfFieldset.disabled = !enabled;
}

export function setGenerateEnabled(enabled) {
  generateBtn.disabled = !enabled;
}

export function renderPdfEntries(files, onFieldChange) {
  pdfEntriesEl.innerHTML = '';

  files.forEach((pdf, index) => {
    const entry = document.createElement('div');
    entry.className = 'pdf-entry';
    entry.innerHTML = `
      <h3 class="pdf-entry-filename">${escapeHtml(pdf.name)}</h3>
      <div class="field">
        <label for="pdf-${index}-title">Title</label>
        <input id="pdf-${index}-title" type="text" value="${escapeHtml(pdf.title)}" />
      </div>
      <div class="field">
        <label for="pdf-${index}-author">Author</label>
        <input id="pdf-${index}-author" type="text" value="${escapeHtml(pdf.author)}" />
      </div>
      <div class="field">
        <label for="pdf-${index}-date">Date</label>
        <input id="pdf-${index}-date" type="date" value="${escapeHtml(pdf.date)}" />
      </div>
      <div class="field">
        <label for="pdf-${index}-description">Description</label>
        <textarea id="pdf-${index}-description" rows="2">${escapeHtml(pdf.description)}</textarea>
      </div>
    `;

    entry.querySelector(`#pdf-${index}-title`).addEventListener('input', (e) =>
      onFieldChange(index, 'title', e.target.value));
    entry.querySelector(`#pdf-${index}-author`).addEventListener('input', (e) =>
      onFieldChange(index, 'author', e.target.value));
    entry.querySelector(`#pdf-${index}-date`).addEventListener('input', (e) =>
      onFieldChange(index, 'date', e.target.value));
    entry.querySelector(`#pdf-${index}-description`).addEventListener('input', (e) =>
      onFieldChange(index, 'description', e.target.value));

    pdfEntriesEl.appendChild(entry);
  });
}
