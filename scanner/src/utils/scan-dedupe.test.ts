import { describe, expect, it } from "vitest";
import { createScanDedupe } from "./scan-dedupe";

describe("createScanDedupe", () => {
    it("emits once while the same code stays in view", () => {
        const dedupe = createScanDedupe(800);

        expect(dedupe.accept("CODE")).toBe(true);
        expect(dedupe.accept("CODE")).toBe(false);
        expect(dedupe.accept("CODE")).toBe(false);
    });

    it("allows the same code after it leaves the view", () => {
        const dedupe = createScanDedupe(800);

        expect(dedupe.accept("CODE")).toBe(true);
        dedupe.miss(100);
        dedupe.miss(500);
        expect(dedupe.accept("CODE")).toBe(false);

        dedupe.miss(800);
        dedupe.miss(1600);
        expect(dedupe.accept("CODE")).toBe(true);
    });

    it("accepts a different code immediately", () => {
        const dedupe = createScanDedupe(800);

        expect(dedupe.accept("CODE-A")).toBe(true);
        expect(dedupe.accept("CODE-B")).toBe(true);
        expect(dedupe.accept("CODE-B")).toBe(false);
    });
});
