# Electron WebP 批量转 PNG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Electron 重建 WebP 批量转 PNG 工具，并自动发布 Windows NSIS 安装包。

**Architecture:** `converter.js` 独立处理非递归扫描和 sharp 转换；`main.js` 提供 Electron 窗口与 IPC；`preload.js` 仅暴露两个受限操作；renderer 只显示最小界面。electron-builder 打出当前用户安装的 Setup.exe。

**Tech Stack:** Electron、sharp、Node.js 原生测试、electron-builder、GitHub Actions。

## Global Constraints

- 不使用 Tkinter、Python 或 Pillow。
- 仅处理源目录的直系 `.webp` / `.WEBP` 文件，输出同名 PNG，直接覆盖。
- 单个转换失败不中断批处理，返回成功数和失败文件列表。
- `npm start` 在 macOS 预览；Windows 产物是 `WebP-to-PNG-Setup.exe`，无需管理员权限。

---

### Task 1: Node 转换模块

**Files:**
- Create: `package.json`, `converter.js`, `tests/converter.test.js`

**Interfaces:**
- `findWebpFiles(sourceDir): Promise<string[]>`
- `convertDirectory(sourceDir, outputDir): Promise<{ succeeded: number, failed: string[] }>`

- [ ] **Step 1: 写失败测试**

```js
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
  await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } }).webp().toFile(path.join(source, 'b.webp'));
  await sharp({ create: { width: 1, height: 1, channels: 3, background: 'blue' } }).webp().toFile(path.join(source, 'a.WEBP'));
  await fs.mkdir(path.join(source, 'nested'));
  assert.deepEqual((await findWebpFiles(source)).map(path.basename), ['a.WEBP', 'b.webp']);
});

test('converts valid files and records invalid files', async () => {
  const source = await tempDir();
  const output = await tempDir();
  await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } }).webp().toFile(path.join(source, 'ok.webp'));
  await fs.writeFile(path.join(source, 'bad.webp'), 'not a webp');
  const result = await convertDirectory(source, output);
  assert.equal(result.succeeded, 1);
  assert.deepEqual(result.failed, [path.join(source, 'bad.webp')]);
  await fs.access(path.join(output, 'ok.png'));
});
```

- [ ] **Step 2: 安装依赖并确认失败原因是模块尚不存在**

Run: `npm install --save sharp && npm install --save-dev electron electron-builder`

Run: `node --test tests/converter.test.js`

Expected: FAIL，报错 `Cannot find module '../converter'`。

- [ ] **Step 3: 实现最小转换模块**

```js
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
```

- [ ] **Step 4: 验证并提交**

Run: `node --test tests/converter.test.js`

Expected: PASS，2 项测试通过。

```bash
git add package.json package-lock.json converter.js tests/converter.test.js
git commit -m "feat: add Electron conversion core"
```

### Task 2: Electron 界面与 IPC

**Files:**
- Create: `main.js`, `preload.js`, `renderer/index.html`, `renderer/styles.css`, `renderer/renderer.js`, `tests/preload.test.js`
- Modify: `package.json`

**Interfaces:**
- Renderer 使用 `window.webpTool.chooseFolder()` 和 `window.webpTool.convert(sourceDir, outputDir)`。
- 主进程使用 `convertDirectory`。

- [ ] **Step 1: 写 preload API 的失败测试**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('preload exposes only folder selection and conversion', () => {
  const source = fs.readFileSync('preload.js', 'utf8');
  assert.match(source, /contextBridge\.exposeInMainWorld/);
  assert.match(source, /chooseFolder/);
  assert.match(source, /convert/);
});
```

- [ ] **Step 2: 确认失败**

Run: `node --test tests/preload.test.js`

Expected: FAIL，`preload.js` 不存在。

- [ ] **Step 3: 实现窗口、桥接和单页界面**

`main.js` 创建 680×300 的 BrowserWindow，设置 `contextIsolation: true` 和 `nodeIntegration: false`；处理 `choose-folder`（`dialog.showOpenDialog`）及 `convert-directory`（调用 `convertDirectory`）IPC。

`preload.js` 内容：

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('webpTool', {
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  convert: (sourceDir, outputDir) => ipcRenderer.invoke('convert-directory', sourceDir, outputDir),
});
```

renderer 必须只显示源文件夹、输出文件夹、开始转换、状态文字；转换时禁用按钮，完成后显示成功和失败数。package scripts 为：

```json
{
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "test": "node --test",
    "dist:win": "electron-builder --win nsis"
  }
}
```

- [ ] **Step 4: 验证并提交**

Run: `npm test`

Expected: PASS。

Run: `npm start`

Expected: macOS 打开包含全部控件的 Electron 窗口。

```bash
git add main.js preload.js renderer package.json tests/preload.test.js
git commit -m "feat: add Electron desktop interface"
```

### Task 3: Windows 发布迁移

**Files:**
- Modify: `.github/workflows/build.yml`, `README.md`, `.gitignore`, `package.json`
- Create: `tests/workflow.test.js`
- Delete: `app.py`, `converter.py`, `installer.iss`, `requirements.txt`, `tests/test_converter.py`

**Interfaces:**
- `npm run dist:win` 产生 `release/WebP-to-PNG-Setup.exe`。
- GitHub Actions 上传和发布该文件。

- [ ] **Step 1: 写 Workflow 的失败检查**

```js
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
```

- [ ] **Step 2: 确认旧 Workflow 失败**

Run: `node --test tests/workflow.test.js`

Expected: FAIL，因为旧 Python Workflow 不包含 `npm ci`。

- [ ] **Step 3: 切换打包和说明**

package build 配置必须包含：

```json
{
  "build": {
    "appId": "com.czl0411.webp-to-png",
    "productName": "WebP to PNG",
    "directories": { "output": "release" },
    "nsis": {
      "perMachine": false,
      "oneClick": false,
      "artifactName": "WebP-to-PNG-Setup.${ext}"
    }
  }
}
```

工作流使用 Node 22，依序运行 `npm ci`、`npm test`、`npm run dist:win`，artifact 与 Release 都指向 `release/WebP-to-PNG-Setup.exe`。README 改为 Electron 的 `npm start` 和 Windows 下载说明；`.gitignore` 加入 `node_modules/`、`release/`、`.electron-builder/`。用 `git rm` 移除旧 Tk/Python 文件。

- [ ] **Step 4: 验证并提交**

Run: `npm test && test ! -e app.py && test ! -e requirements.txt && test ! -e installer.iss`

Expected: PASS，且旧运行时文件均不存在。

```bash
git add .github/workflows/build.yml README.md .gitignore package.json tests/workflow.test.js
git rm app.py converter.py installer.iss requirements.txt tests/test_converter.py
git commit -m "ci: build Electron Windows installer"
```

### Task 4: 推送和发布验证

- [ ] **Step 1: 推送并核对主分支构建**

Run: `git push origin main`

Expected: Windows Action 成功，且上传 `WebP转PNG-windows` artifact。

- [ ] **Step 2: 发布 Electron 版本**

Run: `git tag v1.1.0 && git push origin v1.1.0`

Expected: 标签构建成功。

- [ ] **Step 3: 核对 Release**

Run: `curl --silent --fail 'https://api.github.com/repos/Czl0411/webP-png/releases/tags/v1.1.0'`

Expected: 附件包含非空的 `WebP-to-PNG-Setup.exe`。
