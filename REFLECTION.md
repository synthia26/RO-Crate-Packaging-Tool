# Reflection

I used Claude Code as the primary agentic AI tool for this exercise. I treated it as a development assistant rather than assuming that generated code or a successful build meant the solution was correct.

Given the 60-minute limit, I prioritised a working and verified minimum solution before attempting any stretch work. My approach was specification-driven and iterative: define the requirements, verify unfamiliar APIs, implement the minimum application, test it with the supplied PDFs, inspect the generated RO-Crate, and make targeted corrections.

## Specification and API Verification

I started by writing `SPEC.md` and asked Claude to review it against the exercise requirements. This helped clarify the RO-Crate 1.3 `@context` and `conformsTo`, missing metadata handling, collection and PDF dates, top-level PDF discovery, and the Chromium File System Access API requirement.

Before implementation, I asked Claude to verify external library APIs rather than relying on methods that simply looked plausible. Investigation of the installed `ro-crate` package showed that its default context was not RO-Crate 1.3, so the 1.3 context needed to be set explicitly. I also verified how File entities and `hasPart` relationships should be created.

For PDF metadata extraction, I used `pdfjs-dist` and verified its metadata API and Vite worker configuration. I wanted to confirm that AI-suggested API usage actually existed and behaved as expected in the installed package.

## Implementation and Runtime Debugging

Claude implemented the minimum application and the project built successfully. However, my first browser test exposed a runtime issue: after selecting the supplied folder, the PDFs were not loading.

I asked Claude to investigate the actual runtime behaviour. The problem was traced to PDF.js cleanup. The implementation was calling `destroy()` on the resolved PDF document rather than on the loading task returned by `getDocument()`. Because this happened in a `finally` block, otherwise successful metadata extraction was being treated as a failure.

After correcting the cleanup call, I tested again and confirmed that all eight supplied PDFs loaded successfully. This showed why I did not consider a successful build sufficient verification.

## Manual Testing and Corrections

Once the PDFs were loading, I tested the complete workflow with all eight supplied files. I reviewed the extracted metadata, generated the crate, checked the copied PDFs, and directly inspected `ro-crate-metadata.json`.

### Required Collection Metadata

Manual testing showed that the initial implementation could generate a crate while required collection metadata was blank, including the license.

I updated the specification and directed Claude to require collection `name`, `description`, `license`, and `datePublished`. The corrected application prevents generation when a required field is empty and provides a field-specific validation message.

The collection uses `datePublished`, defaulting to the current date in `YYYY-MM-DD` format, while PDF creation dates use `dateCreated`.

### Questionable and Missing PDF Metadata

During metadata review, I found that two supplied PDFs contained an embedded creation date from `1601`. Rather than assuming this was a parser error, I checked the PDF document properties and confirmed that the value was present in the source metadata.

The extraction was correct, but the source value was questionable. I manually removed the date before generating the final crate. I did not add an automatic rule to reject dates before an arbitrary year because that could remove legitimate historical metadata.

Some PDFs also had incomplete embedded metadata. I verified that missing author, creation date, or description did not prevent a PDF from being included. When an embedded title is unavailable, the filename without `.pdf` is used as the editable title. Other missing PDF metadata remains optional and editable rather than being invented.

### Failure Path and RO-Crate Verification

I tested a folder containing no PDF files. The application handled this without crashing, displayed an appropriate status message, and prevented crate generation.

I also manually inspected the generated RO-Crate. I confirmed the RO-Crate 1.3 `@context` and `conformsTo`, root Dataset, and File entities. All eight PDFs were referenced through `hasPart`, with each reference matching a corresponding File entity.

One supplied filename contains spaces, so I verified that its File `@id` was URI-safe and matched the `hasPart` reference, while the physical filename remained unchanged when copied.

## Stretch Feature

Once the minimum requirements were working and verified, I added one stretch feature: SHA-256 checksums.

The checksums are calculated from the PDF bytes using the browser Web Crypto API and recorded against the corresponding File entities. I generated the crate again and confirmed that all eight PDFs contained SHA-256 checksum values.

I chose not to add further stretch features because verification and documentation were more valuable within the available time than adding functionality I might not have enough time to test properly.

## Overall Reflection

Claude Code accelerated specification review, API investigation, implementation, and debugging, but manual verification remained essential. Manual testing helped me identify the PDF loading runtime issue, incomplete collection validation, and questionable source metadata, while also confirming that a folder with no PDFs was handled correctly.

Working from a written specification gave the AI a clearer target and made corrections easier to assess against agreed requirements. Compared with less structured prompting, it was easier to judge whether a suggestion was relevant to the intended design.

With more time, I would add automated RO-Crate validation and tests for metadata parsing, validation, and crate generation, and test the application with a wider range of PDFs.

The main lesson was that agentic AI can make development faster, but engineering judgement is still necessary. I still needed to verify unfamiliar APIs, investigate unexpected results, test both successful and failure paths, and take responsibility for the final solution.