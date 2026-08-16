const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

async function findWebpFiles(sourceDir) {
  const files = [];

  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.webp') {
        files.push(entryPath);
      }
    }
  }

  await visit(sourceDir);
  return files.sort((left, right) => left.localeCompare(right));
}

async function convertDirectory(sourceDir, outputDir) {
  let succeeded = 0;
  const failed = [];

  for (const sourcePath of await findWebpFiles(sourceDir)) {
    try {
      const parsedPath = path.parse(path.relative(sourceDir, sourcePath));
      const outputPath = path.join(outputDir, parsedPath.dir, `${parsedPath.name}.png`);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await sharp(sourcePath).png().toFile(outputPath);
      succeeded += 1;
    } catch {
      failed.push(sourcePath);
    }
  }

  return { succeeded, failed };
}

module.exports = { convertDirectory, findWebpFiles };
