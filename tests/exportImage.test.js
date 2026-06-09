import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  getExportImageFileName,
} from '../src/lib/services/exportImage.ts';

test('getExportImageFileName strips existing extension and appends new one', () => {
  assert.equal(getExportImageFileName('data.json'), 'data.png');
  assert.equal(getExportImageFileName('data.json', 'jpeg'), 'data.jpeg');
  assert.equal(getExportImageFileName(null), 'json.png');
  assert.equal(getExportImageFileName('untitled-1'), 'untitled-1.png');
});

test('exportImage service no longer talks to a Tauri backend', async () => {
  const source = await readFile(
    new URL('../src/lib/services/exportImage.ts', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /@tauri-apps/);
  assert.doesNotMatch(source, /invoke\(/);
  assert.match(source, /from 'html-to-image'/);
});
