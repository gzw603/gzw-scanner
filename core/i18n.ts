import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

export type Locale = "zh" | "en";
export type LocalePreference = "system" | Locale;

const en = {
    "app.name": "Gzw Scanner",
    "app.description": "Wireless scanning from phone to desktop",
    "nav.scan": "Scan",
    "nav.history": "History",
    "nav.settings": "Settings",
    "nav.devices": "Scanner Devices",
    "common.close": "Close",
    "common.continue": "Continue",
    "common.retry": "Retry",
    "common.goBack": "Go back",
    "common.goHome": "Go home",
    "common.maybeLater": "Maybe later",
    "common.iveAddedIt": "I've added it",
    "common.installApp": "Install app",
    "common.skipForNow": "Skip for now",
    "common.connected": "Connected",
    "common.disconnect": "Disconnect",
    "common.deviceLabel": "Device {id}",
    "common.dismiss": "Dismiss",
    "common.cancel": "Cancel",
    "language.title": "Language",
    "language.description": "Interface language. Changes apply immediately.",
    "language.system": "System",
    "language.zh": "中文",
    "language.en": "English",
    "settings.general": "General",
    "settings.camera": "Camera",
    "settings.advanced": "Advanced",
    "settings.about": "About",
    "settings.deviceName": "Device Name",
    "settings.deviceId": "Device ID",
    "settings.historyLength": "History Length",
    "settings.historyLengthDescription": "Max number of entries to keep in scan history.",
    "settings.entries": "{count} entries",
    "settings.scanRatio": "Scan Area Size",
    "settings.scanRatioDescription": "Portion of the viewport used for scanning.",
    "settings.desktopManagedHint": "Scan input, shortcut buttons, and content markers are managed in the desktop app and sync automatically after connecting.",
    "settings.contrast": "Contrast",
    "settings.brightness": "Brightness",
    "settings.resetApp": "Reset App",
    "reset.title": "Reset App",
    "reset.confirmPrefix": "Are you sure you want to",
    "reset.confirmReset": "reset",
    "reset.confirmMiddle": "the app? This is an",
    "reset.confirmIrreversible": "irreversible",
    "reset.confirmSuffix": "action!",
    "reset.hold": "Hold to reset",
    "reset.holding": "Keep holding...",
    "about.version": "Version: {version}",
    "about.license": "License:",
    "about.github": "GitHub:",
    "about.scannerDescription": "Scan with your phone, type on your PC",
    "about.receiverDescription": "Receive scans on your desktop",
    "role.scanner": "Scanner",
    "role.receiver": "Receiver",
    "scan.connectingReceiver": "Connecting to receiver...",
    "scan.connectedSuccess": "Connected successfully!",
    "scan.failedConnect": "Failed to connect receiver: {error}",
    "scan.notConnected": "You are not connected to any receiver.",
    "scan.connectHint": "Scan the QR code on the receiver to connect.",
    "scan.cameraError": "Camera error: {error}",
    "scan.sendFailed": "Could not send to receiver: {error}",
    "scan.sent": "Sent to receiver",
    "scan.notSent": "Not sent: receiver is not connected.",
    "scan.actions": "Key actions",
    "scan.space": "Space",
    "scan.enter": "Enter",
    "scan.tab": "Tab",
    "scan.customShortcut": "Shortcut {index}",
    "scanInput.title": "Scan Input",
    "scanInput.description": "Text and keys sent around scanned content. Changes sync to connected scanners.",
    "scanInput.prefix": "Prefix",
    "scanInput.prefixDescription": "Text sent before each scanned code.",
    "scanInput.suffix": "Suffix",
    "scanInput.suffixDescription": "Text sent after each scanned code.",
    "scanInput.autoAction": "Auto Action",
    "scanInput.autoActionDescription": "Key sent after the suffix. Duplicate final keys are skipped.",
    "scanInput.none": "None",
    "scanInput.markersTitle": "Content Markers",
    "scanInput.markersDescription": "Markers work only inside scanned content. Unknown markers stay as literal text.",
    "shortcuts.title": "Shortcut Buttons",
    "shortcuts.description": "Add up to four custom key buttons to the scan screen. Changes sync automatically.",
    "shortcuts.slot": "Shortcut {index}",
    "shortcuts.label": "Button label",
    "shortcuts.combo": "Key combination",
    "shortcuts.labelPlaceholder": "e.g. Paste",
    "shortcuts.comboPlaceholder": "e.g. Ctrl+V",
    "shortcuts.invalid": "Use Ctrl, Alt, Shift, or Win with one supported key.",
    "shortcuts.emptyHint": "Leave the key combination empty to hide this button.",
    "history.noHistory": "No history yet",
    "history.connectedToPeer": "Connected to peer",
    "history.connectedTo": "Connected to",
    "history.noReceiver": "No receiver",
    "history.oneReceiver": "1 receiver",
    "history.receiverCount": "{count} receivers",
    "history.from": "from {name}",
    "history.replayScan": "Replay scan",
    "history.reconnect": "Reconnect",
    "history.reconnecting": "Reconnecting to {name}...",
    "history.reconnected": "Reconnected to {name}!",
    "history.failedReconnect": "Failed to reconnect: {error}",
    "history.title": "History",
    "history.clear": "Clear",
    "history.clearTitle": "Clear history?",
    "history.clearDescription": "All scan and connection history on this device will be deleted. This cannot be undone.",
    "history.clearAction": "Clear history",
    "history.cleared": "History cleared",
    "connection.waiting": "Waiting for connection",
    "connection.qrAlt": "Connection QR code",
    "connection.scanQrPrefix": "Scan this QR code or visit",
    "connection.scanQrSuffix": "on your mobile device to connect",
    "connection.connectedTo": "Connected to {name}",
    "receiver.scanners.connectedDevices": "Connected devices",
    "receiver.scanners.addDevice": "Add device",
    "receiver.scanners.linkNewDevice": "Link new device",
    "receiver.inputError": "Could not send input: {error}",
    "conn.noIdTitle": "No connection ID",
    "conn.noIdDescription": "This page needs a receiver ID in the URL to connect.",
    "conn.connectingTitle": "Connecting...",
    "conn.connectingPrefix": "Establishing connection to receiver",
    "conn.successTitle": "Connected!",
    "conn.redirecting": "Redirecting to scan...",
    "conn.failedTitle": "Connection failed",
    "onboarding.start": "Start",
    "onboarding.welcome": "Welcome",
    "onboarding.camera": "Camera",
    "onboarding.install": "Install App",
    "onboarding.welcomeTitle": "Welcome to Gzw Scanner",
    "onboarding.welcomeTagline": "Your phone, now a keyboard for your PC.",
    "onboarding.welcomeDescription": "Scan QR codes and barcodes, then send Unicode text and key actions to your computer wirelessly.",
    "onboarding.cameraEnableTitle": "Enable your camera",
    "onboarding.cameraEnableDescription": "We need camera access to scan codes for you.",
    "onboarding.cameraEnableButton": "Enable Camera",
    "onboarding.cameraEnabledTitle": "Camera enabled",
    "onboarding.cameraBlockedTitle": "Camera blocked",
    "onboarding.cameraBlockedDescription": "Enable it in your browser settings, then retry.",
    "onboarding.allSetTitle": "You're all set",
    "onboarding.allSetDescription": "The app is ready to use from your Home Screen.",
    "onboarding.installTitle": "Install the app",
    "onboarding.installDescription": "Get full-screen access with no browser bars, right from your Home Screen.",
    "onboarding.homeScreenTitle": "Add to Home Screen",
    "onboarding.iosStep1Prefix": "Tap",
    "onboarding.iosStep1Suffix": "Share in Safari's toolbar",
    "onboarding.iosStep2Prefix": "Scroll down, tap",
    "onboarding.iosStep2Suffix": "Add to Home Screen",
    "onboarding.iosStep3": "Tap \"Add\" in the top-right corner",
    "onboarding.openSafariTitle": "Open in Safari to install",
    "onboarding.openSafariDescription": "On iPhone and iPad, apps can only be added to the Home Screen through Safari. Open this page in Safari, then tap Share → Add to Home Screen.",
    "onboarding.continueWithoutInstall": "Continue without installing",
    "onboarding.addToDockTitle": "Add to Dock",
    "onboarding.dockStep1Prefix": "Tap",
    "onboarding.dockStep1Suffix": "Share in the toolbar",
    "onboarding.dockStep2": "Choose \"Add to Dock\"",
    "onboarding.otherInstallDescriptionPrefix": "Open your browser menu",
    "onboarding.otherInstallDescriptionSuffix": "and choose \"Install app\" or \"Add to Home screen\".",
    "camera.cameraLabel": "Camera {id}",
    "camera.switchCamera": "Switch camera",
    "camera.front": "Front camera",
    "camera.back": "Back camera",
    "camera.external": "External camera",
    "errors.alreadyConnected": "Already connected",
    "errors.connectionTimeout": "Connection timed out",
    "errors.cameraPermissionDenied": "Camera access was denied. Allow camera permission in your browser settings.",
    "errors.cameraNotFound": "No usable camera was found.",
    "errors.cameraInUse": "The camera is busy or unavailable. Close other camera apps and retry.",
    "errors.cameraUnsupported": "The selected camera does not support the requested settings.",
    "errors.cameraFailed": "Could not access the camera.",
    "errors.peerUnavailable": "The desktop receiver is offline or the connection link has expired.",
    "errors.idTaken": "This device ID is already in use. Close the duplicate app tab and retry.",
    "errors.network": "Network connection failed. Check your connection and retry.",
    "errors.browserUnsupported": "This browser does not support the required WebRTC features.",
    "errors.webrtc": "WebRTC connection failed. Check your network and retry.",
    "errors.unexpected": "An unexpected error occurred",
    "route.notFoundTitle": "Page not found",
    "route.notFoundDescription": "The page you're looking for doesn't exist or has been moved.",
    "route.errorTitle": "Something went wrong",
    "route.tryAgain": "Try again",
} as const;

export type MessageKey = keyof typeof en;

const zh: Record<MessageKey, string> = {
    "app.name": "Gzw Scanner",
    "app.description": "手机扫码，电脑输入",
    "nav.scan": "扫码",
    "nav.history": "历史",
    "nav.settings": "设置",
    "nav.devices": "扫码设备",
    "common.close": "关闭",
    "common.continue": "继续",
    "common.retry": "重试",
    "common.goBack": "返回",
    "common.goHome": "返回首页",
    "common.maybeLater": "以后再说",
    "common.iveAddedIt": "我已添加",
    "common.installApp": "安装应用",
    "common.skipForNow": "暂时跳过",
    "common.connected": "已连接",
    "common.disconnect": "断开连接",
    "common.deviceLabel": "设备 {id}",
    "common.dismiss": "关闭提示",
    "common.cancel": "取消",
    "language.title": "语言",
    "language.description": "界面语言，修改后立即生效。",
    "language.system": "跟随系统",
    "language.zh": "中文",
    "language.en": "English",
    "settings.general": "通用",
    "settings.camera": "摄像头",
    "settings.advanced": "高级",
    "settings.about": "关于",
    "settings.deviceName": "设备名称",
    "settings.deviceId": "设备 ID",
    "settings.historyLength": "历史记录条数",
    "settings.historyLengthDescription": "扫码历史最多保留的条数。",
    "settings.entries": "{count} 条",
    "settings.scanRatio": "扫描区域大小",
    "settings.scanRatioDescription": "用于识别的屏幕区域比例。",
    "settings.desktopManagedHint": "扫码输入、快捷键按钮和内容标记请在电脑端设置，连接后自动同步。",
    "settings.contrast": "对比度",
    "settings.brightness": "亮度",
    "settings.resetApp": "重置应用",
    "reset.title": "重置应用",
    "reset.confirmPrefix": "确定要",
    "reset.confirmReset": "重置",
    "reset.confirmMiddle": "应用吗？此操作",
    "reset.confirmIrreversible": "不可撤销",
    "reset.confirmSuffix": "！",
    "reset.hold": "长按重置",
    "reset.holding": "请继续按住...",
    "about.version": "版本：{version}",
    "about.license": "许可证：",
    "about.github": "GitHub：",
    "about.scannerDescription": "手机扫码，电脑输入",
    "about.receiverDescription": "在电脑上接收扫码内容",
    "role.scanner": "扫码端",
    "role.receiver": "接收端",
    "scan.connectingReceiver": "正在连接接收端...",
    "scan.connectedSuccess": "连接成功！",
    "scan.failedConnect": "连接接收端失败：{error}",
    "scan.notConnected": "当前没有连接接收端。",
    "scan.connectHint": "扫描电脑上的二维码进行连接。",
    "scan.cameraError": "摄像头错误：{error}",
    "scan.sendFailed": "发送到接收端失败：{error}",
    "scan.sent": "已发送到电脑",
    "scan.notSent": "未发送：电脑端未连接。",
    "scan.actions": "按键操作",
    "scan.space": "空格",
    "scan.enter": "回车",
    "scan.tab": "制表符",
    "scan.customShortcut": "快捷键 {index}",
    "scanInput.title": "扫码输入",
    "scanInput.description": "在扫码内容前后添加文本和按键，修改后自动同步到已连接的手机。",
    "scanInput.prefix": "前缀",
    "scanInput.prefixDescription": "每次扫码内容之前发送的文本。",
    "scanInput.suffix": "后缀",
    "scanInput.suffixDescription": "每次扫码内容之后发送的文本。",
    "scanInput.autoAction": "自动按键",
    "scanInput.autoActionDescription": "后缀之后发送的按键；与最后一个按键重复时自动省略。",
    "scanInput.none": "无",
    "scanInput.markersTitle": "内容标记",
    "scanInput.markersDescription": "标记仅在扫码内容中生效，无法识别的标记会按原文本发送。",
    "shortcuts.title": "快捷键按钮",
    "shortcuts.description": "最多添加四个自定义按键按钮到扫码界面，修改后自动同步。",
    "shortcuts.slot": "快捷键 {index}",
    "shortcuts.label": "按钮名称",
    "shortcuts.combo": "按键组合",
    "shortcuts.labelPlaceholder": "例如：粘贴",
    "shortcuts.comboPlaceholder": "例如：Ctrl+V",
    "shortcuts.invalid": "请使用 Ctrl、Alt、Shift 或 Win 加一个受支持的按键。",
    "shortcuts.emptyHint": "按键组合留空时，此按钮不会显示。",
    "history.noHistory": "暂无历史记录",
    "history.connectedToPeer": "已连接到对端",
    "history.connectedTo": "已连接到",
    "history.noReceiver": "没有接收端",
    "history.oneReceiver": "1 个接收端",
    "history.receiverCount": "{count} 个接收端",
    "history.from": "来自 {name}",
    "history.replayScan": "重新发送扫码内容",
    "history.reconnect": "重新连接",
    "history.reconnecting": "正在重新连接 {name}...",
    "history.reconnected": "已重新连接 {name}！",
    "history.failedReconnect": "重新连接失败：{error}",
    "history.title": "历史记录",
    "history.clear": "清空",
    "history.clearTitle": "清空历史记录？",
    "history.clearDescription": "此设备上的扫码记录和连接记录将全部删除，且无法恢复。",
    "history.clearAction": "确认清空",
    "history.cleared": "历史记录已清空",
    "connection.waiting": "等待连接",
    "connection.qrAlt": "连接二维码",
    "connection.scanQrPrefix": "扫描二维码，或在手机上访问",
    "connection.scanQrSuffix": "进行连接",
    "connection.connectedTo": "已连接到 {name}",
    "receiver.scanners.connectedDevices": "已连接设备",
    "receiver.scanners.addDevice": "添加设备",
    "receiver.scanners.linkNewDevice": "连接新设备",
    "receiver.inputError": "输入发送失败：{error}",
    "conn.noIdTitle": "缺少连接 ID",
    "conn.noIdDescription": "此页面需要在网址中提供接收端 ID 才能连接。",
    "conn.connectingTitle": "正在连接...",
    "conn.connectingPrefix": "正在建立与接收端的连接",
    "conn.successTitle": "连接成功！",
    "conn.redirecting": "正在跳转到扫码页面...",
    "conn.failedTitle": "连接失败",
    "onboarding.start": "开始",
    "onboarding.welcome": "欢迎",
    "onboarding.camera": "摄像头",
    "onboarding.install": "安装应用",
    "onboarding.welcomeTitle": "欢迎使用 Gzw Scanner",
    "onboarding.welcomeTagline": "让手机成为电脑的无线键盘。",
    "onboarding.welcomeDescription": "扫描二维码和条形码，通过无线方式把 Unicode 文本和按键操作发送到电脑。",
    "onboarding.cameraEnableTitle": "启用摄像头",
    "onboarding.cameraEnableDescription": "需要摄像头权限才能为您扫码。",
    "onboarding.cameraEnableButton": "启用摄像头",
    "onboarding.cameraEnabledTitle": "摄像头已启用",
    "onboarding.cameraBlockedTitle": "摄像头被阻止",
    "onboarding.cameraBlockedDescription": "请在浏览器设置中允许摄像头权限，然后重试。",
    "onboarding.allSetTitle": "全部准备就绪",
    "onboarding.allSetDescription": "现在可以从主屏幕打开应用了。",
    "onboarding.installTitle": "安装应用",
    "onboarding.installDescription": "从主屏幕全屏打开，不显示浏览器栏。",
    "onboarding.homeScreenTitle": "添加到主屏幕",
    "onboarding.iosStep1Prefix": "点击",
    "onboarding.iosStep1Suffix": "Safari 工具栏中的分享按钮",
    "onboarding.iosStep2Prefix": "向下滚动，点击",
    "onboarding.iosStep2Suffix": "添加到主屏幕",
    "onboarding.iosStep3": "点击右上角的“添加”",
    "onboarding.openSafariTitle": "请在 Safari 中安装",
    "onboarding.openSafariDescription": "在 iPhone 和 iPad 上，只能通过 Safari 添加到主屏幕。请在 Safari 中打开此页面，然后点击分享 → 添加到主屏幕。",
    "onboarding.continueWithoutInstall": "不安装，直接继续",
    "onboarding.addToDockTitle": "添加到程序坞",
    "onboarding.dockStep1Prefix": "点击",
    "onboarding.dockStep1Suffix": "工具栏中的分享按钮",
    "onboarding.dockStep2": "选择“添加到程序坞”",
    "onboarding.otherInstallDescriptionPrefix": "打开浏览器菜单",
    "onboarding.otherInstallDescriptionSuffix": "选择“安装应用”或“添加到主屏幕”。",
    "camera.cameraLabel": "摄像头 {id}",
    "camera.switchCamera": "切换摄像头",
    "camera.front": "前置摄像头",
    "camera.back": "后置摄像头",
    "camera.external": "外接摄像头",
    "errors.alreadyConnected": "已经连接",
    "errors.connectionTimeout": "连接超时",
    "errors.cameraPermissionDenied": "摄像头权限被拒绝，请在浏览器设置中允许访问摄像头。",
    "errors.cameraNotFound": "没有找到可用的摄像头。",
    "errors.cameraInUse": "摄像头正被其他应用占用或暂时不可用，请关闭其他相机应用后重试。",
    "errors.cameraUnsupported": "当前摄像头不支持所选参数。",
    "errors.cameraFailed": "无法访问摄像头。",
    "errors.peerUnavailable": "电脑端未在线，或连接二维码已过期。",
    "errors.idTaken": "当前设备连接标识已被占用，请关闭重复打开的应用页面后重试。",
    "errors.network": "网络连接失败，请检查网络后重试。",
    "errors.browserUnsupported": "当前浏览器不支持所需的 WebRTC 功能。",
    "errors.webrtc": "WebRTC 连接失败，请检查网络后重试。",
    "errors.unexpected": "发生了意外错误",
    "route.notFoundTitle": "页面不存在",
    "route.notFoundDescription": "你访问的页面不存在或已被移动。",
    "route.errorTitle": "出现问题",
    "route.tryAgain": "重试",
};

const [preferredLocale, setPreferredLocale] = makePersisted(
    createSignal<LocalePreference>("system"),
    {
        name: "gzw-scanner-locale",
        storage: localStorage,
    },
);

const systemLocale = (): Locale => {
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    return languages.some((language) => language.toLowerCase().startsWith("zh")) ? "zh" : "en";
};

export const resolvedLocale = (): Locale => {
    const preference = preferredLocale();
    return preference === "system" ? systemLocale() : preference;
};

export const localeTag = () => (resolvedLocale() === "zh" ? "zh-CN" : "en");

export const t = (key: MessageKey, params?: Record<string, string | number>) => {
    let message = (resolvedLocale() === "zh" ? zh : en)[key];

    if (params) {
        for (const [name, value] of Object.entries(params)) {
            message = message.replaceAll(`{${name}}`, String(value));
        }
    }

    return message;
};

const errorField = (error: unknown, key: "name" | "type" | "message") => {
    if (typeof error !== "object" || error === null) return "";
    const value = (error as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
};

export const localizeError = (error: unknown) => {
    const name = errorField(error, "name");
    const type = errorField(error, "type");
    const message = errorField(error, "message") || String(error);

    switch (name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
        case "SecurityError":
            return t("errors.cameraPermissionDenied");
        case "NotFoundError":
        case "DevicesNotFoundError":
            return t("errors.cameraNotFound");
        case "NotReadableError":
        case "TrackStartError":
            return t("errors.cameraInUse");
        case "OverconstrainedError":
        case "ConstraintNotSatisfiedError":
            return t("errors.cameraUnsupported");
        case "NotSupportedError":
            return t("errors.cameraUnsupported");
        case "AbortError":
            return t("errors.cameraFailed");
    }

    switch (type) {
        case "peer-unavailable":
            return t("errors.peerUnavailable");
        case "unavailable-id":
            return t("errors.idTaken");
        case "network":
        case "server-error":
        case "socket-error":
        case "socket-closed":
        case "disconnected":
            return t("errors.network");
        case "browser-incompatible":
            return t("errors.browserUnsupported");
        case "webrtc":
        case "negotiation-failed":
        case "connection-closed":
            return t("errors.webrtc");
    }

    if (message === "Already connected") return t("errors.alreadyConnected");
    if (message === "Connection timed out") return t("errors.connectionTimeout");
    return message || t("errors.unexpected");
};

export const applyDocumentLanguage = () => {
    document.documentElement.lang = localeTag();
    document.title = t("app.name");
};

export { preferredLocale, setPreferredLocale };
