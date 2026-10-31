import appToast from "core/components/app-toast";
import CodeScanner from "@/components/code-scanner";
import { DeviceList } from "@/components/device-list";
import { KeyActionBar } from "@/components/key-action-bar";
import { createFileRoute } from "@tanstack/solid-router";
import { IconCircleCheckFilled } from "@tabler/icons-solidjs";
import { connect, isConnected, lastPeerId, sendScan } from "core/stores/peer-connection";
import { autoAction, scanPrefix, scanSuffix } from "core/stores/scan-input-settings";
import { getDeviceIdFromUrl } from "core/utils/scanner-url";
import { composeScanEvents } from "core/utils/input-events";
import { localizeError, t } from "core/i18n";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { camBrightness, camContrast, scanRatio } from "@/stores/scanner-settings";

export const Route = createFileRoute("/scan")({
    component: RouteComponent,
});

function RouteComponent() {
    let isConnecting = false;
    const [isRestoring, setIsRestoring] = createSignal(Boolean(lastPeerId()) && !isConnected());
    const [successPreview, setSuccessPreview] = createSignal<string | null>(null);
    let successTimer: number | undefined;
    let audioContext: AudioContext | undefined;
    let lastError = "";
    let lastErrorAt = 0;

    const unlockAudio = () => {
        if (!audioContext) {
            try {
                audioContext = new AudioContext();
            } catch {
                return;
            }
        }
        if (audioContext.state === "suspended") void audioContext.resume();
    };

    const playSuccessSound = () => {
        unlockAudio();
        if (!audioContext) return;

        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.22);
    };

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
                setSuccessPreview(scanPreview(code));
                playSuccessSound();
                navigator.vibrate?.([30, 60, 30]);
                if (successTimer) clearTimeout(successTimer);
                successTimer = window.setTimeout(() => setSuccessPreview(null), 2600);
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
        window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
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
        window.removeEventListener("pointerdown", unlockAudio);
        if (successTimer) clearTimeout(successTimer);
        void audioContext?.close();
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

            <Show when={successPreview()}>
                <div
                    class="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-6"
                    role="status"
                    aria-live="assertive"
                >
                    <div class="scan-success-card w-full max-w-sm rounded-3xl bg-success px-6 py-8 text-center text-success-content shadow-2xl">
                        <IconCircleCheckFilled class="mx-auto size-24" />
                        <p class="mt-3 text-3xl font-black">{t("scan.successTitle")}</p>
                        <p class="mt-1 text-lg font-bold opacity-90">{t("scan.sent")}</p>
                        <p class="mt-4 break-all rounded-xl bg-success-content/10 px-3 py-2 font-mono text-sm opacity-90">
                            {successPreview()}
                        </p>
                    </div>
                </div>
            </Show>
        </div>
    );
}
