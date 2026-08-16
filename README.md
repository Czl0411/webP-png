# WebP 批量转 PNG

一个只处理当前文件夹内容的 Windows 小工具：选择含 WebP 图片的文件夹、选择输出文件夹，然后点击“开始转换”。

## 下载与安装

1. 打开仓库的 [Releases](https://github.com/Czl0411/webP-png/releases) 页面。
2. 下载最新的 `WebP-to-PNG-Setup.exe` 并双击运行。
3. 安装不需要管理员权限，会创建开始菜单和桌面快捷方式。

## 使用方法

1. 启动“WebP 转 PNG”。
2. 点击“选择文件夹”，选择含 WebP 图片的源文件夹。
3. 点击“选择文件夹”，选择 PNG 的输出文件夹。
4. 点击“开始转换”。

工具只转换源文件夹第一层中的 `.webp` 文件，不会处理子文件夹。输出目录已有同名 PNG 时会直接覆盖；个别损坏的图片会跳过，完成后会显示成功与失败数量。

## 自动构建

每次推送到 `main`，GitHub Actions 会在 Windows 上测试并构建安装包，可在对应 Actions 运行记录的 `WebP转PNG-windows` artifact 下载。

推送版本标签（例如 `v1.0.0`）后，Actions 还会创建 GitHub Release 并附上 `WebP-to-PNG-Setup.exe`。

### 构建验证

1. 推送到 `main` 后，打开 Actions 的 “Build Windows Setup” 运行记录。
2. 确认测试步骤通过，并下载 `WebP转PNG-windows` artifact。
3. 解压后确认文件名为 `WebP-to-PNG-Setup.exe`，双击后无需管理员权限即可安装。
4. 推送 `v1.0.0` 标签后，在 Releases 页面确认存在同名安装包附件。
