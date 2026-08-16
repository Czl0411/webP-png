const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { convertDirectory } = require('../converter');

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'webp-to-png-'));
}

test('converts nested WebP files into matching output folders', async () => {
  const source = await tempDir();
  const output = await tempDir();
  const nested = path.join(source, 'products', 'summer');
  await fs.mkdir(nested, { recursive: true });
  await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
    .webp()
    .toFile(path.join(source, 'cover.webp'));
  await sharp({ create: { width: 1, height: 1, channels: 3, background: 'blue' } })
    .webp()
    .toFile(path.join(nested, 'cover.WEBP'));

  const result = await convertDirectory(source, output);

  assert.equal(result.succeeded, 2);
  assert.deepEqual(result.failed, []);
  await fs.access(path.join(output, 'cover.png'));
  await fs.access(path.join(output, 'products', 'summer', 'cover.png'));
});

test('converts valid files and records invalid files', async () => {
  const source = await tempDir();
  const output = await tempDir();
  await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
    .webp()
    .toFile(path.join(source, 'ok.webp'));
  await fs.writeFile(path.join(source, 'bad.webp'), 'not a webp');

  const result = await convertDirectory(source, output);

  assert.equal(result.succeeded, 1);
  assert.deepEqual(result.failed, [path.join(source, 'bad.webp')]);
  await fs.access(path.join(output, 'ok.png'));
});
