const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Windows workflow tests and packages Electron', () => {
  const workflow = fs.readFileSync('.github/workflows/build.yml', 'utf8');

  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run dist:win/);
  assert.match(workflow, /release\/WebP-to-PNG-Setup\.exe/);
});

test('electron-builder does not attempt to publish during artifact builds', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  assert.match(packageJson.scripts['dist:win'], /--publish never/);
});
