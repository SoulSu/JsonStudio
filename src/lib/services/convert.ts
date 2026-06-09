// Format conversion service — pure browser-side implementation.
// Heavy parsers are loaded on demand to keep the first paint chunk small.

export type ConvertFormat = 'yaml' | 'xml' | 'toml' | 'csv';

export const CONVERT_FORMATS: { id: ConvertFormat; label: string; lang: string }[] = [
  { id: 'yaml', label: 'YAML', lang: 'yaml' },
  { id: 'xml', label: 'XML', lang: 'xml' },
  { id: 'toml', label: 'TOML', lang: 'ini' },
  { id: 'csv', label: 'CSV', lang: 'plaintext' },
];

function parseJsonStrict(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }
}

export async function convertJson(content: string, format: ConvertFormat): Promise<string> {
  const value = parseJsonStrict(content);
  switch (format) {
    case 'yaml': {
      const yaml = (await import('js-yaml')).default;
      return yaml.dump(value, { noRefs: true, lineWidth: -1 });
    }
    case 'toml': {
      const wrapped = wrapForToml(value);
      const toml = (await import('@iarna/toml')).default;
      return toml.stringify(wrapped as any);
    }
    case 'xml': {
      const { XMLBuilder } = await import('fast-xml-parser');
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true,
        indentBy: '  ',
        suppressEmptyNode: false,
        processEntities: true,
      });
      const xmlBody = builder.build({ root: jsonToXmlSafe(value) });
      return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`.trimEnd() + '\n';
    }
    case 'csv': {
      const Papa = (await import('papaparse')).default;
      const rows = normalizeRowsForCsv(value);
      return Papa.unparse(rows, { newline: '\n' });
    }
  }
}

export async function convertToJson(content: string, format: ConvertFormat): Promise<string> {
  let value: unknown;
  switch (format) {
    case 'yaml': {
      const yaml = (await import('js-yaml')).default;
      try {
        value = yaml.load(content);
      } catch (e) {
        throw new Error(`Invalid YAML: ${(e as Error).message}`);
      }
      break;
    }
    case 'toml': {
      const toml = (await import('@iarna/toml')).default;
      try {
        value = toml.parse(content);
      } catch (e) {
        throw new Error(`Invalid TOML: ${(e as Error).message}`);
      }
      break;
    }
    case 'xml': {
      const { XMLParser } = await import('fast-xml-parser');
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        trimValues: true,
        parseTagValue: true,
        parseAttributeValue: true,
        ignoreDeclaration: true,
      });
      try {
        value = parser.parse(content);
      } catch (e) {
        throw new Error(`Invalid XML: ${(e as Error).message}`);
      }
      break;
    }
    case 'csv': {
      const Papa = (await import('papaparse')).default;
      const result = Papa.parse(content.trim(), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      // papaparse surfaces both warnings (Delimiter / TooFewFields / TooManyFields)
      // and hard parse errors via the same `errors` array. Only fail on errors that
      // left us with no rows; otherwise treat them as informational.
      const fatal = result.errors.find((e: { code: string }) => e.code === 'UndetectableDelimiter' && result.data.length === 0);
      if (fatal) {
        throw new Error(`Invalid CSV: ${fatal.message}`);
      }
      value = result.data;
      break;
    }
  }
  return JSON.stringify(value, null, 2);
}

// ── helpers ────────────────────────────────────────────────────────

// TOML requires a top-level table. Wrap a top-level array as { items: [...] },
// matching what the previous Rust implementation did.
function wrapForToml(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return { items: value };
  if (value !== null && typeof value === 'object') return value as Record<string, unknown>;
  throw new Error('TOML requires a JSON object or array at the top level');
}

// fast-xml-parser handles primitives & objects directly; arrays get rendered
// by repeating the wrapping tag, so the same shape we feed serde here works.
function jsonToXmlSafe(value: unknown): unknown {
  if (value === null) return '';
  if (Array.isArray(value)) return value.map(jsonToXmlSafe);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[sanitizeXmlTag(k)] = jsonToXmlSafe(v);
    }
    return out;
  }
  return value;
}

function sanitizeXmlTag(name: string): string {
  let cleaned = name.replace(/[^A-Za-z0-9_\-.]/g, '_');
  if (!/^[A-Za-z_]/.test(cleaned)) cleaned = '_' + cleaned;
  return cleaned || '_';
}

// CSV needs a uniform array of records. Accept:
//   • array of objects → use as-is, unioning keys
//   • single object → wrap into one row
//   • primitive or array of primitives → render as one-column "value" table
function normalizeRowsForCsv(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (value.every((v) => v !== null && typeof v === 'object' && !Array.isArray(v))) {
      return value as Array<Record<string, unknown>>;
    }
    return value.map((v) => ({ value: v }));
  }
  if (value !== null && typeof value === 'object') {
    return [value as Record<string, unknown>];
  }
  return [{ value: value as never }];
}
