import { render } from "solid-js/web";
import { RouterProvider, createRouter } from "@tanstack/solid-router";
import { routeTree } from "./routeTree.gen";
import { connections, onData, sendScanInputSettings } from "core/stores/peer-connection";
import { scanInputSettings } from "core/stores/scan-input-settings";
import { invoke } from "@tauri-apps/api/core";
import appToast from "core/components/app-toast";
import { localizeError, t } from "core/i18n";
import type { InputEvent } from "core/utils/input-events";
import { createEffect, untrack } from "solid-js";

const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultViewTransition: true,
});

declare module "@tanstack/solid-router" {
    interface Register {
        router: typeof router;
    }
}

onData((_conn, data) => {
    if (data.type === "scan") {
        void invoke("fire_input_events", { events: data.events }).catch((error) => {
            appToast.error(t("receiver.inputError", { error: localizeError(error) }), {
                duration: 8000,
            });
        });
    } else if (data.type === "key") {
        const events: InputEvent[] = [{ kind: "key", combo: data.combo }];
        void invoke("fire_input_events", { events }).catch((error) => {
            appToast.error(t("receiver.inputError", { error: localizeError(error) }), {
                duration: 8000,
            });
        });
    }
});

createEffect(() => {
    const settings = scanInputSettings();
    if (!connections().length) return;

    untrack(() => {
        void sendScanInputSettings(settings).catch((error) => {
            console.error("[settings-sync] failed:", error);
        });
    });
});

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
    render(() => <RouterProvider router={router} />, rootElement);
}
