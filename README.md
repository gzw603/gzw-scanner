# Gzw Scanner

手机扫码，电脑输入。手机打开扫码网页，电脑运行 Windows 接收端；扫码后，Unicode 文本和按键会输入到电脑当前光标位置。

Scan with your phone, type on your PC. Open the scanner PWA on your phone and run the Windows receiver. Scanned Unicode text and key actions are injected into the focused input on the computer.

## 功能 / Features

- Unicode 文本：中文、英文、Emoji、重音字符等。
- 独立按键：空格、回车、Tab。
- 组合快捷键：`Ctrl+V`、`Ctrl+Shift+Tab`、`Shift+Enter`、`Alt+F4` 等。
- 最多四个自定义快捷键按钮。
- 扫码内容标记：`{{SPACE}}`、`{{ENTER}}`、`{{TAB}}`、`{{KEY:Ctrl+V}}`。
- 可配置前缀、后缀和扫码后的自动按键。
- 扫码输入、快捷键按钮和内容标记在电脑端设置，连接后自动同步到手机。
- 扫码历史保留完整事件，可精确重发。
- 中英文界面，默认跟随系统语言，可手动切换。
- WebRTC 点对点传输，不经过业务服务器中转。

## 下载 / Download

- [Gzw-Scanner-Setup.exe](https://github.com/gzw603/gzw-scanner/releases/latest/download/Gzw-Scanner-Setup.exe)：推荐安装版，需要时会安装 WebView2。
- [Gzw-Scanner-Portable.exe](https://github.com/gzw603/gzw-scanner/releases/latest/download/Gzw-Scanner-Portable.exe)：便携版，无需安装，但电脑仍需具备 WebView2。
- [手机扫码端](https://gzw603.github.io/gzw-scanner/scanner/)：直接在手机浏览器打开，可添加到主屏幕。

Windows 10/11 x64。应用未使用代码签名证书，SmartScreen 可能显示警告；确认来源后选择“更多信息”→“仍要运行”。

## 使用 / Usage

1. 在电脑上运行接收端，并在 Windows 提示时允许管理员权限，保持窗口运行。
2. 手机和电脑通常连接同一个 Wi-Fi；公网用于加载扫码网页和建立 WebRTC 信令。
3. 手机浏览器打开扫码端，扫描电脑上的连接二维码。
4. 点中其他程序中要输入的位置，然后在手机上扫码。
5. 需要空格、回车、Tab 或快捷键时，使用扫码页下方的按钮；扫码输入和快捷键按钮可在电脑端“设置”中修改。
6. 每次扫码后，手机会提示发送结果和识别到的内容。

接收端可以放在后台。先点击目标输入框，再扫码。接收端启动时会请求管理员权限，以便向普通程序和管理员程序发送输入；Windows 安全界面仍可能拒绝模拟输入。

## 扫码内容标记 / Content Markers

标记只对扫码内容生效，前缀和后缀按普通文本发送。无法识别的标记会保留为原文本。

```text
ABC{{TAB}}123{{ENTER}}
{{KEY:Ctrl+V}}
产品-{{SPACE}}001
```

支持的组合键修饰符：`Ctrl`、`Alt`、`Shift`、`Win`。支持字母、数字、`F1`-`F12`、方向键、`Home`、`End`、`PageUp`、`PageDown`、`Esc`、`Backspace`、`Delete`、`Insert`、`Space`、`Enter`、`Tab`。不支持鼠标、媒体键和 `Ctrl+Alt+Delete`。

## 开发 / Development

环境要求：Node.js、pnpm、Rust；构建 Windows 安装包需要 Windows 或 GitHub Actions。

```bash
pnpm install
pnpm test
pnpm --filter scanner build
pnpm --filter receiver build
cd receiver/src-tauri && cargo test --lib
```

本地运行接收端：

```bash
pnpm --filter receiver tauri dev
```

本地运行扫码端：

```bash
pnpm --filter scanner dev
```

发布由 `.github/workflows/build-release.yml` 完成。推送到 `main` 会发布手机扫码端到 GitHub Pages；推送 `v*` 标签会生成 Windows 安装版和便携版 EXE。

## 技术栈 / Stack

- Windows 接收端：Tauri 2 + SolidJS + Rust + enigo
- 手机扫码端：SolidJS PWA + ZXing
- 通信：PeerJS / WebRTC
- 共享代码：`core/`

## 许可证 / License

MIT。本项目基于 [Newish0/linked-scanner](https://github.com/Newish0/linked-scanner) 修改，保留上游 MIT 版权声明。详见 [LICENSE](LICENSE)。
