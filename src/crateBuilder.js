import { ROCrate } from 'ro-crate';

// Verified against the installed ro-crate 3.7.2 source: a bare `new ROCrate()`
// defaults to RO-Crate 1.2. Seeding the constructor with our own @context and
// @graph (rather than patching afterwards) produces the exact required
// RO-Crate 1.3 @context/conformsTo with no further correction needed.
const RO_CRATE_CONTEXT_URL = 'https://w3id.org/ro/crate/1.3/context';
const RO_CRATE_CONFORMS_TO_URL = 'https://w3id.org/ro/crate/1.3';

/**
 * Build an RO-Crate from reviewed collection and per-PDF metadata.
 * Assumes collection.name, .description, .license, and .datePublished have
 * already been validated as non-blank by the caller (see main.js).
 * @param {{ collection: {name: string, description: string, license: string, datePublished: string},
 *           files: Array<{name: string, title: string, author: string, date: string, description: string, sha256?: string}> }} input
 * @returns {object} A plain JSON-LD object ready for JSON.stringify().
 */
export function buildCrate({ collection, files }) {
  const seed = {
    '@context': RO_CRATE_CONTEXT_URL,
    '@graph': [
      { '@id': './', '@type': 'Dataset' },
      {
        '@id': 'ro-crate-metadata.json',
        '@type': 'CreativeWork',
        about: { '@id': './' },
        conformsTo: { '@id': RO_CRATE_CONFORMS_TO_URL },
      },
    ],
  };

  const crate = new ROCrate(seed, {});

  crate.rootDataset.name = collection.name;
  crate.rootDataset.description = collection.description;
  crate.rootDataset.license = collection.license;
  crate.rootDataset.datePublished = collection.datePublished;

  for (const pdf of files) {
    const id = encodeURIComponent(pdf.name);
    const entity = {
      '@id': id,
      '@type': 'File',
      name: pdf.title,
    };
    if (pdf.author) entity.author = pdf.author;
    if (pdf.date) entity.dateCreated = pdf.date;
    if (pdf.description) entity.description = pdf.description;
    if (pdf.sha256) entity.sha256 = pdf.sha256;

    crate.addEntity(entity);
    crate.addValues(crate.rootId, 'hasPart', { '@id': id });
  }

  // ro-crate always serialises @context as an array (even for a single
  // entry); collapse the single-item case back to the equivalent plain
  // string form for the written-out ro-crate-metadata.json.
  const json = crate.toJSON();
  if (Array.isArray(json['@context']) && json['@context'].length === 1) {
    json['@context'] = json['@context'][0];
  }

  return json;
}
