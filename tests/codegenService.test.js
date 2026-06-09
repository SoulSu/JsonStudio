import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CODEGEN_LANGUAGES,
  generateCode,
  codeToJson,
  supportsReverse,
} from '../src/lib/services/codegen.ts';

test('CODEGEN_LANGUAGES no longer contains protobuf/thrift', () => {
  const ids = CODEGEN_LANGUAGES.map((l) => l.id);
  assert.ok(!ids.includes('protobuf'));
  assert.ok(!ids.includes('thrift'));
});

test('supportsReverse always returns false in Web build', () => {
  for (const l of CODEGEN_LANGUAGES) {
    assert.equal(supportsReverse(l.id), false);
  }
});

test('codeToJson throws explicitly in Web build', async () => {
  await assert.rejects(() => codeToJson('x', 'typescript', 'Foo'), /not available/);
});

test('generateCode emits TypeScript interface from sample JSON', async () => {
  const code = await generateCode('{"name":"a","age":1}', 'typescript', 'Person');
  assert.match(code, /interface Person/);
  assert.match(code, /name\s*:\s*string/);
  assert.match(code, /age\s*:\s*number/);
});

test('generateCode emits Go struct from sample JSON', async () => {
  const code = await generateCode('{"name":"a","age":1}', 'go', 'Person');
  assert.match(code, /type Person struct/);
  assert.match(code, /Name\s+string/);
  assert.match(code, /Age\s+int/);
});
