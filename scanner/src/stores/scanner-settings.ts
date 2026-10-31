import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";
import type { AutoAction } from "core/utils/input-events";

export const [camContrast, setCamContrast] = makePersisted(createSignal(100), {
    name: "camContrast",
    storage: localStorage,
});

export const [camBrightness, setCamBrightness] = makePersisted(createSignal(100), {
    name: "camBrightness",
    storage: localStorage,
});

export const [scanRatio, setScanRatio] = makePersisted(createSignal(2 / 3), {
    name: "scanRatio",
    storage: localStorage,
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

export type ShortcutButton = {
    label: string;
    combo: string;
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
