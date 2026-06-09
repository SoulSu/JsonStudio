// JSON processing service — pure browser-side implementation.
// Three-level parse chain mirrors the previous Rust backend:
//   1. JSON.parse (standard JSON, fastest)
//   2. JSON5.parse (comments, trailing commas, unquoted keys, etc.)
//   3. JSON5.parse with sanitized special numerics (Infinity / NaN → null)
import JSON5 from 'json5';
import jsonMap from '@mischnic/json-sourcemap';

export interface ValidationResult {
  valid: boolean;
  error_message: string | null;
  error_line: number | null;
  error_column: number | null;
}

export interface JsonStats {
  valid: boolean;
  key_count: number;
  depth: number;
  byte_size: number;
  format_type: string; // "JSON" | "JSON5" | ""
  error_info: ValidationResult | null;
}

type ParseOutcome =
  | { ok: true; value: unknown; format: 'JSON' | 'JSON5' }
  | { ok: false; error: Error };

function parseChain(content: string): ParseOutcome {
  try {
    return { ok: true, value: JSON.parse(content), format: 'JSON' };
  } catch {
    /* fall through */
  }
  try {
    return { ok: true, value: JSON5.parse(content), format: 'JSON5' };
  } catch {
    /* fall through */
  }
  const sanitized = sanitizeJson5SpecialValues(content);
  try {
    return { ok: true, value: JSON5.parse(sanitized), format: 'JSON5' };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}

export async function formatJson(content: string, indent = 2): Promise<string> {
  const r = parseChain(content);
  if (!r.ok) throw new Error(`JSON/JSON5 parsing error: ${r.error.message}`);
  return indent === 0 ? JSON.stringify(r.value) : JSON.stringify(r.value, null, indent);
}

export async function minifyJson(content: string): Promise<string> {
  const r = parseChain(content);
  if (!r.ok) throw new Error(`JSON/JSON5 parsing error: ${r.error.message}`);
  return JSON.stringify(r.value);
}

export async function validateJson(content: string): Promise<ValidationResult> {
  const r = parseChain(content);
  if (r.ok) return { valid: true, error_message: null, error_line: null, error_column: null };
  const { line, column, message } = extractErrorLocation(content, r.error);
  return { valid: false, error_message: message, error_line: line, error_column: column };
}

export async function getJsonStats(content: string): Promise<JsonStats> {
  const byte_size = new TextEncoder().encode(content).length;
  const r = parseChain(content);
  if (r.ok) {
    return {
      valid: true,
      key_count: countKeys(r.value),
      depth: calculateDepth(r.value),
      byte_size,
      format_type: r.format,
      error_info: null,
    };
  }
  const { line, column, message } = extractErrorLocation(content, r.error);
  return {
    valid: false,
    key_count: 0,
    depth: 0,
    byte_size,
    format_type: '',
    error_info: { valid: false, error_message: message, error_line: line, error_column: column },
  };
}

export async function escapeString(content: string): Promise<string> {
  return JSON.stringify(content);
}

export async function unescapeString(content: string): Promise<string> {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed !== 'string') {
      throw new Error('expected a JSON string literal');
    }
    return parsed;
  } catch (e) {
    throw new Error(`Unescape failed: ${(e as Error).message}`);
  }
}

// ── helpers ─────────────────────────────────────────────────────────

function countKeys(value: unknown): number {
  if (value === null || typeof value !== 'object') return 0;
  if (Array.isArray(value)) {
    let n = 0;
    for (const item of value) n += countKeys(item);
    return n;
  }
  const map = value as Record<string, unknown>;
  let n = Object.keys(map).length;
  for (const k of Object.keys(map)) n += countKeys(map[k]);
  return n;
}

function calculateDepth(value: unknown): number {
  if (value === null || typeof value !== 'object') return 0;
  if (Array.isArray(value)) {
    let max = 0;
    for (const item of value) max = Math.max(max, calculateDepth(item));
    return 1 + max;
  }
  const map = value as Record<string, unknown>;
  let max = 0;
  for (const k of Object.keys(map)) max = Math.max(max, calculateDepth(map[k]));
  return 1 + max;
}

// Mirrors Rust's sanitize_json5_special_values: replace Infinity/-Infinity/+Infinity/NaN
// tokens with null (skipping quoted strings) so JSON5.parse won't choke on representations
// that don't map cleanly into JS numbers/values via our standard chain.
function sanitizeJson5SpecialValues(content: string): string {
  let out = '';
  const len = content.length;
  let i = 0;
  while (i < len) {
    const ch = content[i];
    if (ch === '"' || ch === "'") {
      i = skipQuoted(content, i, ch, (s) => (out += s));
      continue;
    }
    if ((ch === '+' || ch === '-') && matchesWord(content, i + 1, 'Infinity')) {
      out += 'null';
      i += 1 + 8;
      continue;
    }
    if (matchesWord(content, i, 'Infinity')) {
      out += 'null';
      i += 8;
      continue;
    }
    if ((ch === '+' || ch === '-') && matchesWord(content, i + 1, 'NaN')) {
      out += 'null';
      i += 1 + 3;
      continue;
    }
    if (matchesWord(content, i, 'NaN')) {
      out += 'null';
      i += 3;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function skipQuoted(src: string, start: number, quote: string, push: (s: string) => void): number {
  push(quote);
  let i = start + 1;
  const len = src.length;
  while (i < len && src[i] !== quote) {
    if (src[i] === '\\' && i + 1 < len) {
      push(src[i] + src[i + 1]);
      i += 2;
    } else {
      push(src[i]);
      i++;
    }
  }
  if (i < len) {
    push(quote);
    i++;
  }
  return i;
}

function matchesWord(src: string, pos: number, word: string): boolean {
  if (pos < 0 || pos + word.length > src.length) return false;
  if (pos > 0) {
    const prev = src.charCodeAt(pos - 1);
    if (isIdentChar(prev)) return false;
  }
  for (let j = 0; j < word.length; j++) {
    if (src[pos + j] !== word[j]) return false;
  }
  const after = pos + word.length;
  if (after < src.length) {
    const next = src.charCodeAt(after);
    if (isIdentChar(next)) return false;
  }
  return true;
}

function isIdentChar(code: number): boolean {
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 // _
  );
}

// Pulls a 1-based (line, column) from whatever error we got. Prefers the
// rich diagnostics from @mischnic/json-sourcemap when available; otherwise
// scrapes the message produced by JSON.parse / JSON5.parse.
function extractErrorLocation(
  content: string,
  err: Error,
): { line: number | null; column: number | null; message: string } {
  let line: number | null = null;
  let column: number | null = null;

  try {
    jsonMap.parse(content);
  } catch (mapErr: any) {
    if (mapErr && typeof mapErr === 'object') {
      if (typeof mapErr.line === 'number') line = mapErr.line + 1;
      if (typeof mapErr.column === 'number') column = mapErr.column + 1;
    }
  }

  if (line == null || column == null) {
    const loc = parseLineColFromMessage(err.message);
    if (line == null) line = loc.line;
    if (column == null) column = loc.column;
  }

  return { line, column, message: stripErrorLocation(err.message) };
}

function parseLineColFromMessage(msg: string): { line: number | null; column: number | null } {
  // JSON5: "JSON5: invalid character 'x' at 3:5"
  const m1 = /at (\d+):(\d+)/.exec(msg);
  if (m1) return { line: Number(m1[1]), column: Number(m1[2]) };
  // V8 JSON.parse: "Unexpected token ... in JSON at position N"
  const m2 = /at position (\d+)/.exec(msg);
  if (m2) return { line: null, column: Number(m2[1]) + 1 };
  return { line: null, column: null };
}

function stripErrorLocation(msg: string): string {
  return msg
    .replace(/\s*at line \d+ column \d+.*$/, '')
    .replace(/\s+at \d+:\d+\s*$/, '')
    .replace(/\s+in JSON at position \d+\s*$/, '');
}
