import type { MessageKey } from "../i18n";

export type InputEvent =
    | { kind: "text"; value: string }
    | { kind: "key"; combo: string };

export type AutoAction = "none" | "space" | "enter" | "tab";

const MODIFIERS = ["Ctrl", "Alt", "Shift", "Win"] as const;
type Modifier = (typeof MODIFIERS)[number];

const MODIFIER_ALIASES: Record<string, Modifier> = {
    ctrl: "Ctrl",
    control: "Ctrl",
    alt: "Alt",
    option: "Alt",
    shift: "Shift",
    win: "Win",
    windows: "Win",
    meta: "Win",
};

const NAMED_KEYS: Record<string, string> = {
    up: "Up",
    arrowup: "Up",
    down: "Down",
    arrowdown: "Down",
    left: "Left",
    arrowleft: "Left",
    right: "Right",
    arrowright: "Right",
    home: "Home",
    end: "End",
    pageup: "PageUp",
    pagedown: "PageDown",
    esc: "Esc",
    escape: "Esc",
    backspace: "Backspace",
    delete: "Delete",
    insert: "Insert",
    space: "Space",
    enter: "Enter",
    return: "Enter",
    tab: "Tab",
};

const normalizeMainKey = (value: string) => {
    const lower = value.toLowerCase();
    if (/^[a-z]$/.test(lower)) return lower.toUpperCase();
    if (/^[0-9]$/.test(lower)) return lower;
    if (/^f(?:[1-9]|1[0-2])$/.test(lower)) return lower.toUpperCase();
    return NAMED_KEYS[lower] ?? null;
};

export const normalizeKeyCombo = (value: string): string | null => {
    const parts = value
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length === 0) return null;

    const modifiers = new Set<Modifier>();
    let mainKey: string | null = null;

    for (const part of parts) {
        const modifier = MODIFIER_ALIASES[part.toLowerCase()];
        if (modifier) {
            if (modifiers.has(modifier)) return null;
            modifiers.add(modifier);
            continue;
        }

        const key = normalizeMainKey(part);
        if (!key || mainKey) return null;
        mainKey = key;
    }

    if (!mainKey) return null;
    if (modifiers.has("Ctrl") && modifiers.has("Alt") && mainKey === "Delete") return null;

    return [...MODIFIERS.filter((modifier) => modifiers.has(modifier)), mainKey].join("+");
};

export const AUTO_ACTION_COMBOS: Record<Exclude<AutoAction, "none">, string> = {
    space: "Space",
    enter: "Enter",
    tab: "Tab",
};

const pushText = (events: InputEvent[], value: string) => {
    if (!value) return;
    const previous = events.at(-1);
    if (previous?.kind === "text") previous.value += value;
    else events.push({ kind: "text", value });
};

export const parseScannedContent = (content: string): InputEvent[] => {
    const events: InputEvent[] = [];
    const markerPattern = /\{\{\s*(?:KEY\s*:\s*([^{}]+?)|(SPACE|ENTER|TAB))\s*\}\}/gi;
    let cursor = 0;

    for (const match of content.matchAll(markerPattern)) {
        if (match.index === undefined) continue;

        const combo = normalizeKeyCombo(match[1] ?? match[2] ?? "");
        if (!combo) continue;

        pushText(events, content.slice(cursor, match.index));
        events.push({ kind: "key", combo });
        cursor = match.index + match[0].length;
    }

    pushText(events, content.slice(cursor));
    return events;
};

type ComposeScanOptions = {
    content: string;
    prefix: string;
    suffix: string;
    autoAction: AutoAction;
};

export const composeScanEvents = (options: ComposeScanOptions): InputEvent[] => {
    const events: InputEvent[] = [];

    pushText(events, options.prefix);
    events.push(...parseScannedContent(options.content));
    pushText(events, options.suffix);

    const autoCombo =
        options.autoAction === "none" ? null : AUTO_ACTION_COMBOS[options.autoAction];
    const lastEvent = events.at(-1);
    if (autoCombo && !(lastEvent?.kind === "key" && lastEvent.combo === autoCombo)) {
        events.push({ kind: "key", combo: autoCombo });
    }

    return events;
};

export type AutoActionOption = {
    value: AutoAction;
    labelKey: MessageKey;
};

export const AUTO_ACTION_OPTIONS: AutoActionOption[] = [
    { value: "none", labelKey: "scanInput.none" },
    { value: "space", labelKey: "scan.space" },
    { value: "enter", labelKey: "scan.enter" },
    { value: "tab", labelKey: "scan.tab" },
];
