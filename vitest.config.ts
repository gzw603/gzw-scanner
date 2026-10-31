import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["core/**/*.test.ts", "scanner/src/**/*.test.ts", "receiver/src/**/*.test.ts"],
    },
});
