import { describe, expect, test } from "vitest";
import { localizeDeviceName, nameFromId } from "./names";

const deviceId = "8DDpLZ6RdROE0VWq2jwbK";

describe("device names", () => {
    test("generates names in the active language", () => {
        expect(nameFromId(deviceId, "en")).toBe("Curious Mint Panther");
        expect(nameFromId(deviceId, "zh")).toBe("好奇的薄荷黑豹");
    });

    test("localizes generated names without replacing custom names", () => {
        expect(localizeDeviceName(deviceId, "Curious Mint Panther", "zh")).toBe(
            "好奇的薄荷黑豹",
        );
        expect(localizeDeviceName(deviceId, "我的电脑", "zh")).toBe("我的电脑");
    });
});
