# RO-Crate PDF Packaging Tool

A browser-based tool that packages a folder of PDF documents into an [RO-Crate](https://www.researchobject.org/ro-crate/) 1.3 dataset. It extracts available embedded PDF metadata, lets you review and edit it, and writes a conformant `ro-crate-metadata.json` plus copies of the source PDFs to an output folder.

See [SPEC.md](SPEC.md) for the full design specification.

## Features

- Select a source folder of PDFs via the browser's File System Access API.
- Discover `.pdf` files in the top level of that folder (case-insensitive, non-recursive).
- Automatically extract available embedded PDF metadata (title, author, creation date, description) using `pdfjs-dist`.
- Review and edit collection metadata (name, description, license, date published) and per-PDF metadata (title, author, date, description).
- Generate an RO-Crate 1.3 dataset using the `ro-crate` npm library, with a correct `@context`, `conformsTo`, root `Dataset` entity, `File` entities, and `hasPart` relationships.
- Compute a SHA-256 checksum for each PDF and record it on its `File` entity.
- Write `ro-crate-metadata.json` and copies of the referenced PDFs to a chosen output folder.
- Required-field validation before generation, with status messages and field focus on error.

## Technology Stack

- Vanilla JavaScript (no UI framework), built with [Vite](https://vite.dev/).
- [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist) for embedded PDF metadata extraction.
- [`ro-crate`](https://www.npmjs.com/package/ro-crate) for RO-Crate construction.
- Browser File System Access API for folder selection and file I/O.
- Browser Web Crypto API (`crypto.subtle`) for SHA-256 checksums.

## Prerequisites

- Node.js 20 or later, with npm.
- A recent Chromium-based browser (e.g. Google Chrome or Microsoft Edge) — see [Browser Requirement](#browser-requirement) below.

## Installation and Running

```bash
npm install
npm run dev
```

Open the printed local URL (e.g. `http://localhost:5173`) in a Chromium-based browser.

To build for production and preview the build:

```bash
npm run build
npm run preview
```

## How to Use

1. **Select source folder** — click "Select source folder…" and choose a folder containing PDF files.
2. **Review metadata** — once PDFs are loaded, the Collection Metadata and PDF Metadata sections become editable:
   - Fill in collection **Name**, **Description**, **License**, and **Date Published** (defaults to today's date).
   - For each listed PDF, review and correct the pre-filled **Title**, **Author**, **Date**, and **Description** fields.
3. **Generate** — click "Select output folder & generate RO-Crate", choose an output folder, and the tool writes `ro-crate-metadata.json` and copies of the PDFs there.
4. Status messages near the top of the page report progress, validation errors (with the offending field focused), and success or failure.

### Metadata Review and Missing Metadata

Embedded PDF metadata is often incomplete or entirely absent — some source PDFs may have no extractable title, author, or description. In these cases the corresponding field is left blank (title falls back to the filename) for you to fill in manually; extraction failures on one PDF do not prevent the others from loading. Collection name, description, license, and date published are required and validated before generation; PDF-level fields (title, author, date, description) remain optional and editable throughout.

## RO-Crate 1.3 Output Structure

The generated `ro-crate-metadata.json` contains:

- A top-level `@context`: `https://w3id.org/ro/crate/1.3/context`.
- A **Metadata Descriptor** (`ro-crate-metadata.json`, type `CreativeWork`) with `conformsTo`: `https://w3id.org/ro/crate/1.3` and `about` referencing the root dataset.
- A **root Dataset entity** (`./`) with the reviewed `name`, `description`, `license`, `datePublished`, and a `hasPart` reference to every PDF `File` entity.
- A **File entity** per PDF, with a percent-encoded, URI-safe `@id` matching its `hasPart` reference (the copied PDF filename on disk is left unchanged), plus the reviewed `name`, `author`, `dateCreated`, and `description` where provided.

## SHA-256 Checksum Support

Each PDF's SHA-256 checksum is computed client-side via the Web Crypto API and recorded as a `sha256` property (lowercase hex string) on its `File` entity in the generated metadata. If checksum computation fails for a file, the property is simply omitted rather than blocking generation.

## Browser Requirement

This application requires a **Chromium-based browser** (e.g. Chrome or Edge) that supports the **File System Access API**, which is used for both source and output folder selection and for writing files. Browsers without this API (e.g. Firefox, Safari) are not supported; the app detects this and shows an error message instead of failing silently.
