import appToast from "core/components/app-toast";
import CodeScanner from "@/components/code-scanner";
import { DeviceList } from "@/components/device-list";
import { KeyActionBar } from "@/components/key-action-bar";
import { createFileRoute } from "@tanstack/solid-router";
import { connect, isConnected, lastPeerId, sendScan } from "core/stores/peer-connection";
import { autoAction, scanPrefix, scanSuffix } from "core/stores/scan-input-settings";
import { getDeviceIdFromUrl } from "core/utils/scanner-url";
import { composeScanEvents } from "core/utils/input-events";
import { localizeError, t } from "core/i18n";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { camBrightness, camContrast, scanRatio } from "@/stores/scanner-settings";

export const Route = createFileRoute("/scan")({
    component: RouteComponent,
});

function RouteComponent() {
    let isConnecting = false;
    const [isRestoring, setIsRestoring] = createSignal(Boolean(lastPeerId()) && !isConnected());
    let lastError = "";
    let lastErrorAt = 0;

    let lastScannedCode = "";
    const scanPreview = (content: string) => {
        const singleLine = content.replace(/\s+/g, " ").trim();
        return singleLine.length > 80 ? `${singleLine.slice(0, 80)}…` : singleLine;
    };

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
            setTimeout(() => (lastScannedCode = ""), 2500);

            if (!isConnected()) {
                appToast.warning(t("scan.notSent"), {
                    id: "scan-result",
                    description: t("scan.connectHint"),
                    duration: 3000,
                });
                return;
            }

            try {
                await sendScan(
                    code,
                    composeScanEvents({
                        content: code,
                        prefix: scanPrefix(),
                        suffix: scanSuffix(),
                        autoAction: autoAction(),
                    }),
                );
                appToast.success(t("scan.sent"), {
                    id: "scan-result",
                    description: scanPreview(code),
                    duration: 2200,
                });
            } catch (error) {
                appToast.error(t("scan.sendFailed", { error: localizeError(error) }));
            }
        }
    };

    const handleError = (error: unknown) => {
        const message = localizeError(error);
        if (message === lastError && Date.now() - lastErrorAt < 5000) return;
        lastError = message;
        lastErrorAt = Date.now();
        appToast.error(t("scan.cameraError", { error: localizeError(error) }));
    };

    onMount(() => {
        if (!isRestoring()) return;
        const target = lastPeerId();
        if (!target) {
            setIsRestoring(false);
            return;
        }

        isConnecting = true;
        appToast.loading(t("scan.connectingReceiver"), { id: "restore-connection" });
        void connect(target)
            .then(() => {
                appToast.success(t("scan.connectedSuccess"), { id: "restore-connection" });
            })
            .catch((error) => {
                appToast.error(t("scan.failedConnect", { error: localizeError(error) }), {
                    id: "restore-connection",
                });
            })
            .finally(() => {
                isConnecting = false;
                setIsRestoring(false);
            });
    });

    createEffect(() => {
        if (isConnected() || isRestoring()) {
            appToast.dismiss("no-connection");
            return;
        }

        appToast.warning(t("scan.notConnected"), {
            id: "no-connection",
            dismissible: false,
            description: t("scan.connectHint"),
            duration: 10e12,
        });
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
