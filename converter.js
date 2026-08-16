const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

async function findWebpFiles(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.webp')
    .map((entry) => path.join(sourceDir, entry.name))
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right)));
}

async function convertDirectory(sourceDir, outputDir) {
  let succeeded = 0;
  const failed = [];

  for (const sourcePath of await findWebpFiles(sourceDir)) {
    try {
      await sharp(sourcePath).png().toFile(path.join(outputDir, `${path.parse(sourcePath).name}.png`));
      succeeded += 1;
    } catch {
      failed.push(sourcePath);
    }
  }

  return { succeeded, failed };
}

module.exports = { convertDirectory, findWebpFiles };
