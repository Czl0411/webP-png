# WebP 批量转 PNG

一个 Electron 小工具：选择含 WebP 图片的源文件夹、选择 PNG 输出文件夹，然后点击“开始转换”。

工具会转换源文件夹及所有子文件夹中的 `.webp` 文件，并在输出目录保留原有的子目录层级。输出目录已有同名 PNG 时会直接覆盖；个别损坏的图片会跳过，完成后显示成功与失败数量。

## 下载与安装

1. 打开仓库的 [Releases](https://github.com/Czl0411/webP-png/releases) 页面。
2. 下载最新的 `WebP-to-PNG-Setup.exe` 并双击运行。
3. 安装不需要管理员权限，会创建开始菜单和桌面快捷方式。

## 本地预览

需要 Node.js 22 或更高版本：

```bash
npm ci
npm start
```

## 自动构建

每次推送到 `main`，GitHub Actions 会在 Windows 上运行 `npm test` 并构建安装包，可在对应运行记录的 `WebP转PNG-windows` artifact 下载。

推送版本标签（例如 `v1.1.0`）后，Actions 会创建 GitHub Release 并附上 `WebP-to-PNG-Setup.exe`。
