const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { convertDirectory, findWebpFiles } = require('../converter');

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'webp-to-png-'));
}

test('lists only direct WebP files', async () => {
  const source = await tempDir();
  await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
    .webp()
    .toFile(path.join(source, 'b.webp'));
  await sharp({ create: { width: 1, height: 1, channels: 3, background: 'blue' } })
    .webp()
    .toFile(path.join(source, 'a.WEBP'));
  await fs.mkdir(path.join(source, 'nested'));

  assert.deepEqual((await findWebpFiles(source)).map((file) => path.basename(file)), ['a.WEBP', 'b.webp']);
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
