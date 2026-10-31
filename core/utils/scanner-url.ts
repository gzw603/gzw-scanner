export const SCANNER_PWA_URL = `https://gzw603.github.io/gzw-scanner/scanner/#/conn`;

export const getConnectionUrl = (deviceId: string) => `${SCANNER_PWA_URL}?id=${deviceId}`;

export const getDeviceIdFromUrl = (url: string) => {
    if (url.startsWith(SCANNER_PWA_URL)) {
        const hash = new URL(url).hash;
        const idx = hash.indexOf("?");
        return idx !== -1 ? new URLSearchParams(hash.slice(idx)).get("id") : null;
    }

    return null;
};
