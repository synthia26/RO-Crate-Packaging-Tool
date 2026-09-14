# RO-Crate PDF Packaging Tool Specification

## 1. Goal

Build a small browser-based JavaScript application that allows a user to select a folder of PDF documents, extract available embedded metadata, review and edit collection and file metadata, and generate an RO-Crate conforming to RO-Crate 1.3.

The generated crate must contain the reviewed metadata, `ro-crate-metadata.json`, and copies of the source PDF files.

## 2. Scope

Minimum requirements:

- JavaScript implementation.
- Browser-based single-page interface.
- Select a source folder.
- Discover PDF files in the top level of the selected folder only (no recursive traversal).
- Extract available embedded PDF metadata using `pdfjs-dist`.
- Display editable collection metadata.
- Display editable metadata for each PDF; this editable view also serves as the list of discovered PDFs.
- Use the `ro-crate` npm library to construct the crate.
- Generate an RO-Crate conforming to RO-Crate 1.3.
- Allow the user to select an output directory.
- Write `ro-crate-metadata.json` and the referenced PDFs to the output directory.

Scope is limited to the supplied sample PDF collection; handling of very large folders is not a requirement.

Stretch goals are not part of the initial implementation.

## 3. User Workflow

1. User selects a source directory.
2. Application discovers `.pdf` files in the top level of that directory (non-recursive) using a case-insensitive extension check.
3. Application extracts available embedded metadata from each PDF using `pdfjs-dist`.
4. Extracted metadata is normalised into the application's metadata model.
5. Application displays editable collection metadata and editable metadata for every PDF; this is the sole, primary view of the discovered PDFs (no separate read-only file list).
6. User reviews and corrects the metadata.
7. User selects an output directory.
8. Application constructs the RO-Crate using the `ro-crate` npm library.
9. Application writes `ro-crate-metadata.json` and copies all referenced PDFs to the output directory.
10. Application reports success or an actionable error.

## 4. Metadata Model

### Collection metadata

- name — required before generation.
- description — required before generation.
- license — required before generation; entered and edited by the user; the application does not infer or auto-populate a license from PDF content or metadata.
- datePublished — required before generation; defaults to the current date (`YYYY-MM-DD`) and remains editable.

### PDF metadata

- source File object
- filename
- title
- author (plain string for the minimum implementation)
- date (the PDF's creation date)
- description

Embedded metadata is used only to initialise editable values. The reviewed values in the application model are used when generating the crate.

If an embedded title is unavailable, the filename without the `.pdf` extension is used as the initial editable title.

If an embedded creation date is available, it initialises the editable date value. If author, date, or description are unavailable, the corresponding field is left blank and remains editable; no placeholder text is generated.

Date values are normalised to `YYYY-MM-DD` before being used to generate the crate.

## 5. RO-Crate Structure

The generated metadata must conform to RO-Crate 1.3.

`ro-crate-metadata.json` has a top-level `@context` key, not a separate entity, as a sibling of the `@graph` array that contains the Metadata Descriptor, Root Data Entity, and PDF entities:

- `@context`: `https://w3id.org/ro/crate/1.3/context`

### Metadata Descriptor

- `@id`: `ro-crate-metadata.json`
- `@type`: `CreativeWork`
- `about`: reference to `./`
- `conformsTo`: `https://w3id.org/ro/crate/1.3`

### Root Data Entity

- `@id`: `./`
- `@type`: `Dataset`
- `name`
- `description`
- `license`
- `datePublished`: the reviewed collection date published, in `YYYY-MM-DD` format (defaults to the current date, editable before generation)
- `hasPart`: references every PDF `File` entity

### PDF entities

Each PDF must be represented as a `File` entity.

- `@id`: relative PDF filename, percent-encoded where necessary to form a valid URI reference. The matching `hasPart` reference in the root Dataset must use the same encoded form. The physical copied filename on disk is left unchanged (not encoded).
- `@type`: `File`
- `name`: reviewed title
- `author`: reviewed author, as a plain string
- `dateCreated`: reviewed date, normalised to `YYYY-MM-DD`, when provided
- `description`: reviewed description, when provided

Every PDF referenced by `hasPart` must exist in the generated output directory.

## 6. Error Handling

- Ignore non-PDF files.
- Missing embedded metadata must not cause a PDF to be rejected.
- Failure to extract metadata from one PDF must not prevent other PDFs from loading.
- Use the filename without `.pdf` as the fallback editable title.
- Missing author, date, or description values are left blank (not defaulted) and remain editable.
- Generation must not proceed when no PDFs are loaded.
- Generation must not proceed when required collection metadata (name, description, license, datePublished) is blank; the first missing field is reported in the status message and given input focus.
- User cancellation of directory selection must not crash the application.
- Errors should be presented as useful status messages.

## 7. Technical Decisions and Assumptions

- Target Chromium-based browsers supporting the File System Access API.
- Use the browser directory picker for source and output directory access.
- Use `pdfjs-dist` for embedded PDF metadata extraction.
- Use the required `ro-crate` npm package for RO-Crate construction.
- Keep PDF parsing, UI/application state, RO-Crate construction, and output writing reasonably separated.
- Do not assume undocumented external-library APIs. Uncertain API usage should be verified before acceptance.

## 8. Out of Scope for Initial Implementation

The following stretch goals will only be considered after the minimum requirements are complete and verified:

- SHA-256 checksums
- ORCID identifiers
- automated RO-Crate validation
- static-site preview
