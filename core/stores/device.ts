import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";
import { resolvedLocale } from "../i18n";
import { nameFromId } from "../utils/names";
import { customAlphabet } from "nanoid";

const DEVICE_ID_KEY = "deviceId";
const DEVICE_NAME_KEY = "deviceName";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 21);

const storedDeviceId = localStorage.getItem(DEVICE_ID_KEY);
const initialDeviceId = storedDeviceId ? JSON.parse(storedDeviceId) : nanoid();
if (!storedDeviceId) localStorage.setItem(DEVICE_ID_KEY, JSON.stringify(initialDeviceId));

export const [deviceId] = makePersisted(createSignal(initialDeviceId), {
    name: DEVICE_ID_KEY,
    storage: localStorage,
});

const storedDeviceName = localStorage.getItem(DEVICE_NAME_KEY);
if (storedDeviceName) {
    try {
        const name = JSON.parse(storedDeviceName);
        if (
            name === nameFromId(initialDeviceId, "en") ||
            name === nameFromId(initialDeviceId, "zh")
        ) {
            localStorage.removeItem(DEVICE_NAME_KEY);
        }
    } catch {
        localStorage.removeItem(DEVICE_NAME_KEY);
    }
}

const [customDeviceName, setCustomDeviceName] = makePersisted(createSignal(""), {
    name: DEVICE_NAME_KEY,
    storage: localStorage,
});

export const deviceName = () =>
    customDeviceName().trim() || nameFromId(deviceId(), resolvedLocale());
export const setDeviceName = setCustomDeviceName;
