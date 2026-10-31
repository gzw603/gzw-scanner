# Gzw Scanner PWA

Gzw Scanner 的手机扫码端。使用手机摄像头识别二维码/条形码，并把 Unicode 文本、独立按键和组合快捷键发送到电脑。

The phone scanner for Gzw Scanner. It reads QR codes and barcodes with the phone camera, then sends Unicode text, standalone keys and shortcuts to the desktop.

```bash
pnpm --filter scanner dev
VITE_BASE_PATH=/gzw-scanner/scanner/ pnpm --filter scanner build
```

完整使用说明见仓库根目录 [README](../README.md)。
