# RO-Crate PDF Packaging Tool Specification

## 1. Goal

Build a small browser-based JavaScript application that allows a user to select a folder of PDF documents, extract available embedded metadata, review and edit collection and file metadata, and generate an RO-Crate conforming to RO-Crate 1.3.

The generated crate must contain the reviewed metadata, `ro-crate-metadata.json`, and copies of the source PDF files.

## 2. Scope

Minimum requirements:

- JavaScript implementation.
- Browser-based single-page interface.
- Select a source folder.
- Discover PDF files in the selected folder.
- Extract available embedded PDF metadata using a JavaScript PDF parsing library.
- Display editable collection metadata.
- Display editable metadata for each PDF.
- Use the `ro-crate` npm library to construct the crate.
- Generate an RO-Crate conforming to RO-Crate 1.3.
- Allow the user to select an output directory.
- Write `ro-crate-metadata.json` and the referenced PDFs to the output directory.

Stretch goals are not part of the initial implementation.

## 3. User Workflow

1. User selects a source directory.
2. Application discovers `.pdf` files using a case-insensitive extension check.
3. Application extracts available embedded metadata from each PDF.
4. Extracted metadata is normalised into the application's metadata model.
5. Application displays editable collection metadata and editable metadata for every PDF.
6. User reviews and corrects the metadata.
7. User selects an output directory.
8. Application constructs the RO-Crate using the `ro-crate` npm library.
9. Application writes `ro-crate-metadata.json` and copies all referenced PDFs to the output directory.
10. Application reports success or an actionable error.

## 4. Metadata Model

### Collection metadata

- name
- description
- license

### PDF metadata

- source File object
- filename
- title
- author
- date
- description

Embedded metadata is used only to initialise editable values. The reviewed values in the application model are used when generating the crate.

If an embedded title is unavailable, the filename without the `.pdf` extension is used as the initial editable title.

## 5. RO-Crate Structure

The generated metadata must conform to RO-Crate 1.3.

### Metadata Descriptor

- `@id`: `ro-crate-metadata.json`
- `@type`: `CreativeWork`
- `about`: reference to `./`
- `conformsTo`: RO-Crate 1.3

### Root Data Entity

- `@id`: `./`
- `@type`: `Dataset`
- `name`
- `description`
- `license`
- `hasPart`: references every PDF `File` entity

### PDF entities

Each PDF must be represented as a `File` entity.

- `@id`: relative PDF filename/path
- `@type`: `File`
- `name`: reviewed title
- reviewed metadata where available

Every PDF referenced by `hasPart` must exist in the generated output directory.

## 6. Error Handling

- Ignore non-PDF files.
- Missing embedded metadata must not cause a PDF to be rejected.
- Failure to extract metadata from one PDF must not prevent other PDFs from loading.
- Use the filename without `.pdf` as the fallback editable title.
- Generation must not proceed when no PDFs are loaded.
- User cancellation of directory selection must not crash the application.
- Errors should be presented as useful status messages.

## 7. Technical Decisions and Assumptions

- Target Chromium-based browsers supporting the File System Access API.
- Use the browser directory picker for source and output directory access.
- Use a JavaScript PDF parsing library for embedded metadata extraction.
- Use the required `ro-crate` npm package for RO-Crate construction.
- Keep PDF parsing, UI/application state, RO-Crate construction, and output writing reasonably separated.
- Do not assume undocumented external-library APIs. Uncertain API usage should be verified before acceptance.

## 8. Out of Scope for Initial Implementation

The following stretch goals will only be considered after the minimum requirements are complete and verified:

- SHA-256 checksums
- ORCID identifiers
- automated RO-Crate validation
- static-site preview
