import appToast from "core/components/app-toast";
import CodeScanner from "@/components/code-scanner";
import { DeviceList } from "@/components/device-list";
import { KeyActionBar } from "@/components/key-action-bar";
import { createFileRoute } from "@tanstack/solid-router";
import { connect, isConnected, sendScan } from "core/stores/peer-connection";
import { getDeviceIdFromUrl } from "core/utils/scanner-url";
import { composeScanEvents } from "core/utils/input-events";
import { localizeError, t } from "core/i18n";
import { createEffect, onCleanup } from "solid-js";
import {
    autoAction,
    camBrightness,
    camContrast,
    scanPrefix,
    scanRatio,
    scanSuffix,
} from "@/stores/scanner-settings";

export const Route = createFileRoute("/scan")({
    component: RouteComponent,
});

function RouteComponent() {
    let isConnecting = false;
    let lastError = "";
    let lastErrorAt = 0;

    let lastScannedCode = "";
    const handleScan = async (code: string) => {
        const deviceId = getDeviceIdFromUrl(code);
        if (deviceId) {
            if (isConnecting) return;
            isConnecting = true;
            appToast.loading(t("scan.connectingReceiver"), { id: "new-connection" });
            try {
                await connect(deviceId);
                appToast.success(t("scan.connectedSuccess"), { id: "new-connection" });
            } catch (err) {
                appToast.error(
                    t("scan.failedConnect", { error: localizeError(err) }),
                    {
                        id: "new-connection",
                    },
                );
            } finally {
                isConnecting = false;
            }
        } else {
            // Ignore duplicate scans (until timeout ends)
            if (code === lastScannedCode) return;
            lastScannedCode = code;

            appToast.info(code, { duration: 2000 });
            void sendScan(
                code,
                composeScanEvents({
                    content: code,
                    prefix: scanPrefix(),
                    suffix: scanSuffix(),
                    autoAction: autoAction(),
                }),
            ).catch((error) => {
                appToast.error(t("scan.sendFailed", { error: localizeError(error) }));
            });

            setTimeout(() => (lastScannedCode = ""), 2500);
        }
    };

    const handleError = (error: Error) => {
        const message = localizeError(error);
        if (message === lastError && Date.now() - lastErrorAt < 5000) return;
        lastError = message;
        lastErrorAt = Date.now();
        appToast.error(t("scan.cameraError", { error: localizeError(error) }));
    };

    createEffect(async () => {
        if (!isConnected()) {
            appToast.warning(t("scan.notConnected"), {
                id: "no-connection",
                dismissible: false,
                description: t("scan.connectHint"),
                duration: 10e12,
            });
        } else {
            appToast.dismiss("no-connection");
        }
    });

    onCleanup(() => {
        appToast.dismiss("no-connection");
    });

    return (
        <div class="flex flex-col h-full">
            <div class="min-h-0 flex-1">
                <CodeScanner
                    onResult={handleScan}
                    onError={handleError}
                    brightness={camBrightness()}
                    contrast={camContrast()}
                    scanRatio={scanRatio()}
                />
            </div>

            <KeyActionBar />

            <DeviceList />
        </div>
    );
}
