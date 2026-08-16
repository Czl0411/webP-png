# Recursive WebP Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert every WebP file in the selected source folder and its subfolders, while reproducing the source folder hierarchy in the output folder.

**Architecture:** `converter.js` will recursively collect `.webp` paths and sort them deterministically. `convertDirectory` will derive each PNG path from the path relative to the selected source folder, create the required output directory, and retain the existing per-file failure handling.

**Tech Stack:** Node.js 22, node:test, sharp, Electron.

## Global Constraints

- Accept `.webp` file extensions case-insensitively.
- Recreate relative subdirectory paths below the selected output directory.
- Preserve current overwrite behavior for an existing output PNG and continue after an individual conversion fails.
- Keep the interface limited to the existing two folder selectors, conversion button, and status text.
- Build the Windows artifact as `WebP-to-PNG-Setup.exe` through GitHub Actions.

---

## File Structure

- `converter.js`: recursive file discovery and output-path calculation.
- `tests/converter.test.js`: executable coverage for recursive discovery and output hierarchy.
- `README.md`: user-facing explanation of recursive behavior.

### Task 1: Recursively discover and convert WebP files

**Files:**
- Modify: `tests/converter.test.js`
- Modify: `converter.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: `findWebpFiles(sourceDir: string): Promise<string[]>` and `convertDirectory(sourceDir: string, outputDir: string): Promise<{ succeeded: number, failed: string[] }>`.
- Produces: `findWebpFiles` returns WebP files from the entire source tree; `convertDirectory` emits each PNG to the matching relative output directory.

- [x] **Step 1: Write the failing test**

Replace the direct-files assertion with this test, which uses real `sharp` image files and asserts the user-visible output files:

```js
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
```

- [x] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/converter.test.js`

Expected: FAIL because the existing converter reads only direct entries, so `result.succeeded` is `1` and `output/products/summer/cover.png` does not exist.

- [x] **Step 3: Implement the minimal recursive behavior**

Replace direct `readdir` filtering with a local recursive walk and sort the full file paths:

```js
async function findWebpFiles(sourceDir) {
  const files = [];

  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(entryPath);
      else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.webp') files.push(entryPath);
    }
  }

  await visit(sourceDir);
  return files.sort((left, right) => left.localeCompare(right));
}
```

In `convertDirectory`, calculate `relativePath = path.relative(sourceDir, sourcePath)`, write to `path.join(outputDir, path.parse(relativePath).dir, `${path.parse(relativePath).name}.png`)`, and run `await fs.mkdir(path.dirname(outputPath), { recursive: true })` before `sharp(...).toFile(outputPath)`.

- [x] **Step 4: Update the user-facing description**

Change the README sentence that says only the current folder level is converted to state that all subfolders are scanned and their hierarchy is retained below the output directory.

- [x] **Step 5: Run the complete test suite and static diff check**

Run: `npm test && git diff --check`

Expected: all tests pass and `git diff --check` prints no output.

- [x] **Step 6: Commit the implementation**

```bash
git add converter.js tests/converter.test.js README.md
git commit -m "feat: convert WebP files recursively"
```

### Task 2: Publish and verify the Windows installer

**Files:**
- Modify: `package.json` (version only)

**Interfaces:**
- Consumes: the passing recursive converter and the existing `.github/workflows/build.yml` pipeline.
- Produces: a GitHub Release tagged `v1.1.1` with `WebP-to-PNG-Setup.exe` attached.

- [x] **Step 1: Bump the release version**

Change `package.json` from `"version": "1.1.0"` to `"version": "1.1.1"`.

- [x] **Step 2: Re-run tests and commit the version**

Run: `npm test && git diff --check`

Expected: all tests pass with no diff-check output.

```bash
git add package.json
git commit -m "chore: release v1.1.1"
```

- [ ] **Step 3: Push the main branch and verify its Windows build**

Run: `git push origin main`

Wait for the newest GitHub Actions run for `main`. Expected: status `success` and an uploaded artifact named `WebP转PNG-windows` containing `WebP-to-PNG-Setup.exe`.

- [ ] **Step 4: Create the release tag and verify the downloadable installer**

Run:

```bash
git tag v1.1.1
git push origin v1.1.1
```

Wait for the tag workflow. Expected: the GitHub Release `v1.1.1` is published and includes a non-empty asset named exactly `WebP-to-PNG-Setup.exe`.
