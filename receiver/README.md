# Gzw Scanner Receiver

Gzw Scanner 的 Windows 桌面接收端。它通过 WebRTC 接收扫码端发送的有序文本/按键事件，并使用 Rust `enigo` 注入到当前焦点窗口。

The Windows desktop receiver for Gzw Scanner. It receives ordered text/key events over WebRTC and injects them into the focused window with Rust `enigo`.

```bash
pnpm --filter receiver tauri dev
pnpm --filter receiver tauri build
```

构建说明、下载与使用方式见仓库根目录 [README](../README.md)。
