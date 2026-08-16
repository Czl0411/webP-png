# Electron WebP 批量转 PNG：设计规格

## 目标

用 Electron 替换现有 Tkinter/Python 桌面界面，避免 macOS Tk 渲染兼容性问题。应用在 macOS 可本地启动预览，并在 Windows 通过 GitHub Actions 自动构建免管理员权限的 `Setup.exe` 安装包。

## 已确认范围

- Electron 是唯一的桌面运行时；不再依赖 Tkinter 或 Python。
- macOS 用于本地预览，通过 `npm start` 启动。
- Windows 是正式分发平台，发布 `WebP-to-PNG-Setup.exe`。
- 只转换源文件夹当前层的 `.webp` 或 `.WEBP` 文件，不扫描子文件夹。
- 用户选择源文件夹和输出文件夹；同名 PNG 直接覆盖。
- 单个文件失败时继续处理，并在结束时显示成功和失败数量。
- 界面只包含两处文件夹选择、开始转换按钮和状态文字。

## 技术方案

- Electron 主进程：创建窗口，安全地暴露文件夹选择和转换 IPC 接口。
- Electron 渲染进程：纯 HTML/CSS/JavaScript 界面；不直接访问 Node/Electron API。
- Preload 脚本：通过 `contextBridge` 提供最小 API。
- sharp：解码 WebP 并写出 PNG。
- electron-builder：生成 Windows NSIS 安装包；`perMachine: false` 对应当前用户安装，不要求管理员权限。

## 界面与交互

1. “源文件夹”路径文本和“选择文件夹”按钮。
2. “输出文件夹”路径文本和“选择文件夹”按钮。
3. “开始转换”按钮。
4. 状态区域：初始提示、转换中、未找到 WebP、成功/失败数量。

转换期间禁用开始按钮。选择对话框取消时保持原路径不变。

## 处理流程

1. 渲染进程请求主进程打开目录选择对话框。
2. 用户选定两个目录后，点击转换。
3. 主进程验证两个目录、筛选直系 WebP 文件、依次用 sharp 写出同名 PNG。
4. 主进程返回 `{ succeeded, failed }`，渲染进程展示结果。

## 自动构建与发布

- 推送至 `main`：GitHub Actions 在 `windows-latest` 上安装依赖、运行测试、构建 `WebP-to-PNG-Setup.exe` 并上传 artifact。
- 推送 `v*` 标签：在完成同一构建后创建 GitHub Release，附加该安装包。

## 验收标准

- `npm start` 在 macOS 中打开有完整控件的 Electron 窗口。
- 单元测试覆盖非递归扫描、成功转换、错误不中断、目录验证。
- Windows Actions 测试通过并生成有效安装包。
- Release 附件名为 `WebP-to-PNG-Setup.exe`。
