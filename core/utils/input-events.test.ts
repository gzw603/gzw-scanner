import { describe, expect, it } from "vitest";
import {
    composeScanEvents,
    normalizeKeyCombo,
    parseScannedContent,
} from "./input-events";

describe("normalizeKeyCombo", () => {
    it("normalizes case, aliases, and modifier order", () => {
        expect(normalizeKeyCombo("shift + ctrl + v")).toBe("Ctrl+Shift+V");
        expect(normalizeKeyCombo("WIN+ARROWUP")).toBe("Win+Up");
        expect(normalizeKeyCombo("f12")).toBe("F12");
    });

    it("rejects unsupported or invalid combinations", () => {
        expect(normalizeKeyCombo("")).toBeNull();
        expect(normalizeKeyCombo("Ctrl")).toBeNull();
        expect(normalizeKeyCombo("Ctrl+Ctrl+V")).toBeNull();
        expect(normalizeKeyCombo("Ctrl+F13")).toBeNull();
        expect(normalizeKeyCombo("Ctrl+Alt+Delete")).toBeNull();
    });
});

describe("parseScannedContent", () => {
    it("preserves Unicode text and converts markers in order", () => {
        expect(parseScannedContent("你好 {{SPACE}} A{{TAB}}😀{{KEY:Ctrl+V}}")).toEqual([
            { kind: "text", value: "你好 " },
            { kind: "key", combo: "Space" },
            { kind: "text", value: " A" },
            { kind: "key", combo: "Tab" },
            { kind: "text", value: "😀" },
            { kind: "key", combo: "Ctrl+V" },
        ]);
    });

    it("keeps unknown and invalid markers as literal text", () => {
        expect(parseScannedContent("a{{UNKNOWN}}b{{KEY:Ctrl+F13}}c")).toEqual([
            { kind: "text", value: "a{{UNKNOWN}}b{{KEY:Ctrl+F13}}c" },
        ]);
    });
});

describe("composeScanEvents", () => {
    it("wraps content with literal prefix and suffix", () => {
        expect(
            composeScanEvents({
                content: "{{ENTER}}",
                prefix: "p{{SPACE}}",
                suffix: "s",
                autoAction: "enter",
            }),
        ).toEqual([
            { kind: "text", value: "p{{SPACE}}" },
            { kind: "key", combo: "Enter" },
            { kind: "text", value: "s" },
            { kind: "key", combo: "Enter" },
        ]);
    });

    it("does not duplicate an equal final key", () => {
        expect(
            composeScanEvents({ content: "x{{TAB}}", prefix: "", suffix: "", autoAction: "tab" }),
        ).toEqual([
            { kind: "text", value: "x" },
            { kind: "key", combo: "Tab" },
        ]);
    });
});
