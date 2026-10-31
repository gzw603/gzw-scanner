import { Peer, type DataConnection } from "peerjs";
import { createSignal } from "solid-js";
import { makePersisted } from "@solid-primitives/storage";
import { deviceId, deviceName } from "./device";
import { addConnectionHistory, addScanSentHistory, addScanReceivedHistory } from "./history";
import { normalizeKeyCombo, type InputEvent } from "../utils/input-events";
import { localizeDeviceName } from "../utils/names";
import { resolvedLocale } from "../i18n";
import { isScanInputSettings, type ScanInputSettings } from "./scan-input-settings";

// ===== types =====

type ScanData = {
    type: "scan";
    content: string;
    events: InputEvent[];
};

type KeyData = {
    type: "key";
    combo: string;
};

type HelloData = {
    type: "hello";
    name: string;
};

type ScanInputSettingsData = {
    type: "scan-input-settings";
    settings: ScanInputSettings;
};

type Data = ScanData | KeyData | HelloData | ScanInputSettingsData;

type DataHandler = (conn: DataConnection, data: Data) => void;

// ===== state =====

const [_connections, _setConnections] = createSignal<DataConnection[]>([]);
export const connections = () => _connections();
export const isConnected = () => _connections().length > 0;

// Reactive map of peerId -> the name they told us about themselves via "hello".
// Persisted so we still remember a peer's name across reloads, even before
// we've re-connected and received a fresh "hello" from them.
const [peerNames, setPeerNames] = makePersisted(createSignal<Map<string, string>>(new Map()), {
    name: "peerNames",
    serialize: (value) => JSON.stringify([...value.entries()]),
    deserialize: (value) => new Map(JSON.parse(value)),
});
export const getPeerName = (peerId: string) => {
    const name = peerNames().get(peerId);
    return name ? localizeDeviceName(peerId, name, resolvedLocale()) : undefined;
};

const [lastPeerId, setLastPeerId] = makePersisted(createSignal(""), {
    name: "lastPeerId",
    storage: localStorage,
});
export { lastPeerId };

const peer = new Peer(deviceId(), {
    config: {
        iceServers: [
            { urls: "stun:stun.cloudflare.com:3478" },
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ],
    },
});

// Maps each user-supplied callback to the per-connection wrapper functions
// actually registered on that connection, so we can remove the exact same
// function reference later.
const wrappers = new Map<DataHandler, Map<DataConnection, (data: unknown) => void>>();

// ===== guards =====

const isValidData = (data: unknown): data is Data => {
    if (data === null || typeof data !== "object" || !("type" in data)) return false;

    const d = data as { type: unknown };

    if (d.type === "scan") {
        const scan = data as { content?: unknown; events?: unknown };
        return (
            typeof scan.content === "string" &&
            Array.isArray(scan.events) &&
            scan.events.every(
                (event) =>
                    event !== null &&
                    typeof event === "object" &&
                    (("kind" in event && event.kind === "text" && "value" in event && typeof event.value === "string") ||
                        ("kind" in event && event.kind === "key" && "combo" in event && typeof event.combo === "string")),
            )
        );
    }

    if (d.type === "key") {
        return "combo" in data && typeof (data as { combo: unknown }).combo === "string";
    }

    if (d.type === "hello") {
        return "name" in data && typeof (data as { name: unknown }).name === "string";
    }

    if (d.type === "scan-input-settings") {
        return isScanInputSettings((data as { settings?: unknown }).settings);
    }

    return false;
};

// ===== helpers =====

// Attach every currently-registered handler to a (new) connection.
const attachToConnection = (conn: DataConnection) => {
    for (const [cb, connMap] of wrappers) {
        if (connMap.has(conn)) continue;
        const wrapper = (data: unknown) => {
            isValidData(data) && cb(conn, data);
        };
        connMap.set(conn, wrapper);
        conn.on("data", wrapper);
    }
};

// Detach every registered handler from a connection (e.g. on close),
// and forget it so we don't leak map entries.
const detachFromConnection = (conn: DataConnection) => {
    for (const connMap of wrappers.values()) {
        const wrapper = connMap.get(conn);
        if (wrapper) {
            conn.off("data", wrapper);
            connMap.delete(conn);
        }
    }
};

// Records any valid scan data received on a connection to history.
// Shared between the "someone connected to me" and "I connected to
// someone" code paths so both are tracked identically.
const trackReceivedScans = (conn: DataConnection) => {
    const handler = (data: unknown) => {
        if (isValidData(data) && data.type === "scan") {
            addScanReceivedHistory(data.content, conn.peer, data.events);
        }
    };
    conn.on("data", handler);
    conn.on("close", () => {
        conn.off("data", handler);
    });
};

// Listens for "hello" messages on a connection and records the peer's
// self-reported name, so both sides learn each other's name regardless
// of who initiated the connection.
const trackHello = (conn: DataConnection) => {
    const handler = (data: unknown) => {
        if (isValidData(data) && data.type === "hello") {
            setPeerNames((prev) => {
                const next = new Map(prev);
                next.set(conn.peer, data.name);
                return next;
            });
        }
    };
    conn.on("data", handler);
    conn.on("close", () => {
        conn.off("data", handler);
    });
};

// Tells the given connection our own device name. Sent as soon as a
// connection opens, from both sides, so name exchange doesn't depend
// on which side initiated the connection.
const sayHello = (conn: DataConnection) => {
    conn.send({ type: "hello", name: deviceName() } satisfies HelloData);
};

const registerConnection = (conn: DataConnection, peerId: string) => {
    _setConnections((prev) => [...prev, conn]);
    attachToConnection(conn);
    trackReceivedScans(conn);
    trackHello(conn);
    addConnectionHistory(peerId);
    sayHello(conn);

    conn.on("close", () => {
        _setConnections((prev) => prev.filter((c) => c !== conn));
        detachFromConnection(conn);
        // Note: peerNames is intentionally left alone here - it's persisted
        // now, so we keep remembering a peer's name after they disconnect.
    });
};

// ===== event handlers =====

const readyPromise = new Promise<void>((resolve, reject) => {
    peer.on("open", () => resolve());
    peer.on("error", (err) => reject(err));
});

peer.on("connection", (conn) => {
    conn.on("open", () => {
        registerConnection(conn, conn.peer);
    });
});

peer.on("error", (err) => {
    console.error("[peerjs] error:", err.type, err);
});

peer.on("disconnected", () => {
    console.warn("[peerjs] disconnected from signaling server");
});

peer.on("close", () => {
    console.warn("[peerjs] peer destroyed");
});

export const onData = (cb: DataHandler) => {
    let connMap = wrappers.get(cb);
    if (!connMap) {
        connMap = new Map();
        wrappers.set(cb, connMap);
    }
    for (const conn of _connections()) {
        attachToConnection(conn);
    }
};

export const offData = (cb: DataHandler) => {
    const connMap = wrappers.get(cb);
    if (!connMap) return;
    for (const [conn, wrapper] of connMap) {
        conn.off("data", wrapper);
    }
    wrappers.delete(cb);
};

// ===== actions =====

export const connect = async (id: string, timeout = 30000) => {
    await readyPromise;

    const existingConnection = _connections().find((c) => c.peer === id);
    if (existingConnection) throw new Error("Already connected");

    return new Promise<DataConnection>((resolve, reject) => {
        const conn = peer.connect(id, {
            metadata: { id: deviceId },
        });

        let settled = false;
        let timeoutId: ReturnType<typeof setTimeout>;

        const cleanup = () => {
            clearTimeout(timeoutId);
            conn.off("open", handleOpen);
            conn.off("error", handleError);
            conn.off("close", handleClose);
            peer.off("error", handlePeerError);
        };

        const rejectOnce = (error: unknown) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        };

        const handleOpen = () => {
            if (settled) return;
            settled = true;
            cleanup();
            registerConnection(conn, id);
            setLastPeerId(id);
            resolve(conn);
        };

        const handleError = (error: unknown) => {
            rejectOnce(error);
            conn.close();
        };

        const handleClose = () => {
            rejectOnce(Object.assign(new Error("Connection closed"), { type: "connection-closed" }));
        };

        const handlePeerError = (error: unknown) => {
            const type =
                typeof error === "object" && error !== null && "type" in error
                    ? (error as { type?: unknown }).type
                    : undefined;
            const message =
                typeof error === "object" && error !== null && "message" in error
                    ? String((error as { message?: unknown }).message)
                    : "";
            if (type !== "peer-unavailable" || !message.includes(id)) return;
            rejectOnce(error);
            conn.close();
        };

        timeoutId = setTimeout(() => {
            conn.close();
            rejectOnce(new Error("Connection timed out"));
        }, timeout);

        conn.on("open", handleOpen);
        conn.on("error", handleError);
        conn.on("close", handleClose);
        peer.on("error", handlePeerError);
    });
};

const sendData = async (data: Data) => {
    await readyPromise;
    await Promise.all(_connections().map((conn) => conn.send(data)));
};

export const sendScan = async (content: string, events: InputEvent[]) => {
    await sendData({
        type: "scan",
        content,
        events,
    });

    addScanSentHistory(
        content,
        _connections().map((c) => c.peer),
        events,
    );
};

export const sendKey = async (combo: string) => {
    const normalized = normalizeKeyCombo(combo);
    if (!normalized) throw new Error("Invalid key combination");

    await sendData({
        type: "key",
        combo: normalized,
    });
};

export const sendScanInputSettings = async (settings: ScanInputSettings) => {
    await sendData({
        type: "scan-input-settings",
        settings,
    });
};
