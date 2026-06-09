import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatJson,
  minifyJson,
  validateJson,
  getJsonStats,
  escapeString,
  unescapeString,
} from '../src/lib/services/json.ts';

test('formatJson formats standard JSON with default 2-space indent', async () => {
  const out = await formatJson('{"a":1,"b":[2,3]}');
  assert.equal(out, '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
});

test('formatJson indent=0 produces compact output', async () => {
  assert.equal(await formatJson('{"a":1}', 0), '{"a":1}');
});

test('formatJson accepts JSON5 (comments, trailing comma, unquoted keys)', async () => {
  const out = await formatJson("{ a: 1, /* c */ b: 'x', }");
  assert.equal(out, '{\n  "a": 1,\n  "b": "x"\n}');
});

test('formatJson sanitizes Infinity/NaN via fallback', async () => {
  const out = await formatJson('{"a": Infinity, "b": -Infinity, "c": NaN}');
  assert.equal(out, '{\n  "a": null,\n  "b": null,\n  "c": null\n}');
});

test('formatJson does NOT touch Infinity inside strings', async () => {
  const out = await formatJson('{"msg": "value is Infinity"}');
  assert.equal(out, '{\n  "msg": "value is Infinity"\n}');
});

test('formatJson throws on bad input', async () => {
  await assert.rejects(() => formatJson('{"a":}'), /JSON\/JSON5 parsing error/);
});

test('minifyJson strips whitespace', async () => {
  assert.equal(await minifyJson('{\n  "a": 1\n}'), '{"a":1}');
});

test('validateJson reports valid for JSON, JSON5 and sanitized inputs', async () => {
  assert.equal((await validateJson('{"a":1}')).valid, true);
  assert.equal((await validateJson('{ a: 1, }')).valid, true);
  assert.equal((await validateJson('{"a": Infinity}')).valid, true);
});

test('validateJson reports error location for broken JSON', async () => {
  const r = await validateJson('{"a": 1,\n  "b": }');
  assert.equal(r.valid, false);
  assert.ok(r.error_message);
  assert.ok(r.error_line == null || r.error_line >= 1);
  assert.ok(r.error_column == null || r.error_column >= 1);
});

test('getJsonStats counts keys, depth, byte_size and format type', async () => {
  const r = await getJsonStats('{"a":1,"b":{"c":[1,2,{"d":3}]}}');
  assert.equal(r.valid, true);
  assert.equal(r.format_type, 'JSON');
  assert.equal(r.key_count, 4); // a, b, c, d
  assert.equal(r.depth, 4);     // {.b.c[].{d}}
  assert.ok(r.byte_size > 0);
  assert.equal(r.error_info, null);
});

test('getJsonStats detects JSON5 format', async () => {
  const r = await getJsonStats('{ a: 1, /* x */ }');
  assert.equal(r.valid, true);
  assert.equal(r.format_type, 'JSON5');
});

test('getJsonStats returns invalid for broken input', async () => {
  const r = await getJsonStats('{"a":');
  assert.equal(r.valid, false);
  assert.equal(r.format_type, '');
  assert.ok(r.error_info);
});

test('escapeString wraps and escapes', async () => {
  assert.equal(await escapeString('a "b" c'), '"a \\"b\\" c"');
  assert.equal(await escapeString('line\n2'), '"line\\n2"');
});

test('unescapeString reverses escapeString', async () => {
  assert.equal(await unescapeString('"a \\"b\\" c"'), 'a "b" c');
  assert.equal(await unescapeString('"line\\n2"'), 'line\n2');
});

test('unescapeString rejects non-string JSON literals', async () => {
  await assert.rejects(() => unescapeString('123'), /Unescape failed/);
});
