# Gzw Scanner Receiver

Gzw Scanner 的 Windows 桌面接收端。它通过 WebRTC 接收扫码端发送的有序文本/按键事件，优先使用 Windows `SendInput` 注入到当前焦点窗口，失败时自动尝试浏览器/控件兼容输入。

The Windows desktop receiver for Gzw Scanner. It receives ordered text/key events over WebRTC, injects them with Windows `SendInput`, and falls back to browser/control-compatible input when the system rejects simulation.

```bash
pnpm --filter receiver tauri dev
pnpm --filter receiver tauri build
```

构建说明、下载与使用方式见仓库根目录 [README](../README.md)。
