const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('preload exposes only folder selection and conversion', () => {
  const source = fs.readFileSync('preload.js', 'utf8');

  assert.match(source, /contextBridge\.exposeInMainWorld/);
  assert.match(source, /chooseFolder/);
  assert.match(source, /convert/);
});
