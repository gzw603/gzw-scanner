import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";
import type { AutoAction } from "../utils/input-events";

export type ShortcutButton = {
    label: string;
    combo: string;
};

export type ScanInputSettings = {
    prefix: string;
    suffix: string;
    autoAction: AutoAction;
    shortcuts: ShortcutButton[];
};

const DEFAULT_SHORTCUTS: ShortcutButton[] = Array.from({ length: 4 }, () => ({
    label: "",
    combo: "",
}));

const normalizeShortcuts = (value: unknown): ShortcutButton[] =>
    Array.from({ length: 4 }, (_, index) => {
        const shortcut = Array.isArray(value) ? value[index] : undefined;
        return {
            label:
                shortcut && typeof shortcut === "object" && typeof shortcut.label === "string"
                    ? shortcut.label
                    : "",
            combo:
                shortcut && typeof shortcut === "object" && typeof shortcut.combo === "string"
                    ? shortcut.combo
                    : "",
        };
    });

export const [scanPrefix, setScanPrefix] = makePersisted(createSignal(""), {
    name: "scanPrefix",
    storage: localStorage,
});

export const [scanSuffix, setScanSuffix] = makePersisted(createSignal(""), {
    name: "scanSuffix",
    storage: localStorage,
});

export const [autoAction, setAutoAction] = makePersisted(createSignal<AutoAction>("enter"), {
    name: "scanAutoAction",
    storage: localStorage,
});

export const [shortcutButtons, setShortcutButtons] = makePersisted(
    createSignal<ShortcutButton[]>(DEFAULT_SHORTCUTS),
    {
        name: "shortcutButtons",
        storage: localStorage,
        serialize: JSON.stringify,
        deserialize: (value) => normalizeShortcuts(JSON.parse(value)),
    },
);

export const updateShortcutButton = (index: number, patch: Partial<ShortcutButton>) => {
    setShortcutButtons((current) =>
        current.map((shortcut, currentIndex) =>
            currentIndex === index ? { ...shortcut, ...patch } : shortcut,
        ),
    );
};

export const scanInputSettings = (): ScanInputSettings => ({
    prefix: scanPrefix(),
    suffix: scanSuffix(),
    autoAction: autoAction(),
    shortcuts: shortcutButtons(),
});

export const isScanInputSettings = (value: unknown): value is ScanInputSettings => {
    if (value === null || typeof value !== "object") return false;
    const settings = value as Partial<ScanInputSettings>;
    return (
        typeof settings.prefix === "string" &&
        typeof settings.suffix === "string" &&
        (settings.autoAction === "none" ||
            settings.autoAction === "space" ||
            settings.autoAction === "enter" ||
            settings.autoAction === "tab") &&
        Array.isArray(settings.shortcuts) &&
        settings.shortcuts.length === 4 &&
        settings.shortcuts.every(
            (shortcut) =>
                shortcut !== null &&
                typeof shortcut === "object" &&
                typeof shortcut.label === "string" &&
                typeof shortcut.combo === "string",
        )
    );
};

export const applyScanInputSettings = (settings: ScanInputSettings) => {
    setScanPrefix(settings.prefix);
    setScanSuffix(settings.suffix);
    setAutoAction(settings.autoAction);
    setShortcutButtons(normalizeShortcuts(settings.shortcuts));
};
