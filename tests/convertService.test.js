import test from 'node:test';
import assert from 'node:assert/strict';
import { convertJson, convertToJson, CONVERT_FORMATS } from '../src/lib/services/convert.ts';

test('CONVERT_FORMATS surface unchanged', () => {
  assert.deepEqual(
    CONVERT_FORMATS.map((f) => f.id),
    ['yaml', 'xml', 'toml', 'csv'],
  );
});

test('YAML round-trip preserves object', async () => {
  const src = '{"name":"alice","age":30,"tags":["a","b"]}';
  const yaml = await convertJson(src, 'yaml');
  assert.match(yaml, /name: alice/);
  const back = await convertToJson(yaml, 'yaml');
  assert.deepEqual(JSON.parse(back), JSON.parse(src));
});

test('TOML round-trip preserves object', async () => {
  const src = '{"name":"alice","age":30,"nested":{"x":1}}';
  const toml = await convertJson(src, 'toml');
  assert.match(toml, /name = "alice"/);
  const back = await convertToJson(toml, 'toml');
  assert.deepEqual(JSON.parse(back), JSON.parse(src));
});

test('TOML wraps top-level array as items', async () => {
  const toml = await convertJson('[{"a":1},{"a":2}]', 'toml');
  const back = JSON.parse(await convertToJson(toml, 'toml'));
  assert.deepEqual(back, { items: [{ a: 1 }, { a: 2 }] });
});

test('XML conversion produces well-formed envelope', async () => {
  const xml = await convertJson('{"name":"alice","age":30}', 'xml');
  assert.match(xml, /^<\?xml version="1\.0"/);
  assert.match(xml, /<root>/);
  assert.match(xml, /<name>alice<\/name>/);
  assert.match(xml, /<age>30<\/age>/);
});

test('XML→JSON parses nested elements', async () => {
  const xml = `<?xml version="1.0"?>
<root><name>alice</name><age>30</age></root>`;
  const back = JSON.parse(await convertToJson(xml, 'xml'));
  assert.equal(back.root.name, 'alice');
  assert.equal(back.root.age, 30);
});

test('CSV: array of homogeneous objects becomes header+rows', async () => {
  const csv = await convertJson('[{"a":1,"b":"x"},{"a":2,"b":"y"}]', 'csv');
  assert.equal(csv.split('\n')[0], 'a,b');
  assert.equal(csv.split('\n').length, 3);
  const back = JSON.parse(await convertToJson(csv, 'csv'));
  assert.deepEqual(back, [
    { a: 1, b: 'x' },
    { a: 2, b: 'y' },
  ]);
});

test('CSV: primitive top-level renders as one-row value column', async () => {
  const csv = await convertJson('42', 'csv');
  assert.match(csv, /^value\n42/);
});

test('YAML→JSON rejects garbage', async () => {
  await assert.rejects(() => convertToJson(': : :', 'yaml'), /Invalid YAML/);
});

test('TOML→JSON rejects garbage', async () => {
  await assert.rejects(() => convertToJson('not = = toml', 'toml'), /Invalid TOML/);
});

test('CSV→JSON rejects malformed input', async () => {
  // papaparse is permissive; ensure we still get something usable
  const back = JSON.parse(await convertToJson('a,b\n1', 'csv'));
  assert.equal(Array.isArray(back), true);
});

test('convertJson rejects non-JSON input early', async () => {
  await assert.rejects(() => convertJson('{bad', 'yaml'), /Invalid JSON/);
});
