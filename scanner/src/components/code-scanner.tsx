import { makePersisted } from "@solid-primitives/storage";
import { IconCameraRotate } from "@tabler/icons-solidjs";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { createSignal, For, mergeProps, onCleanup, onMount, Show } from "solid-js";
import { t } from "core/i18n";

interface CodeScannerProps {
    onResult: (text: string) => void;
    onError: (error: unknown) => void;
    interval?: number;
    maxDecodeWidth?: number;
    contrast?: number;
    brightness?: number;
    scanRatio?: number;
}

export default function CodeScanner(props: CodeScannerProps) {
    const codeReader = new BrowserMultiFormatReader(undefined);

    const finalProps = mergeProps(
        { contrast: 100, brightness: 100, interval: 200, maxDecodeWidth: 640, scanRatio: 2 / 3 },
        props,
    );

    const [lastDeviceId, setLastDeviceId] = makePersisted(createSignal<string>(), {
        name: "lastCameraDeviceId",
        storage: localStorage,
    });
    const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);
    const [cropRect, setCropRect] = createSignal<{
        left: number;
        top: number;
        size: number;
    } | null>(null);

    let videoRef: HTMLVideoElement | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let ctx: CanvasRenderingContext2D | null = null;
    let timer: number | undefined;
    let currentDeviceId: string | null = null;

    // Downscale for performance
    let busy = false;
    const tick = async () => {
        if (busy || !videoRef || !canvas || !ctx || videoRef.readyState < 2) return;
        const vw = videoRef.videoWidth;
        const vh = videoRef.videoHeight;
        if (!vw || !vh) return;

        const container = videoRef.parentElement!;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (!cw || !ch) return;

        // ponytail: scan area = center square of viewport, ratio configurable
        const dispSize = Math.round(finalProps.scanRatio * Math.min(cw, ch));
        if (dispSize <= 0) return;
        busy = true;
        const dispSx = Math.round((cw - dispSize) / 2);
        const dispSy = Math.round((ch - dispSize) / 2);
        setCropRect({ left: dispSx, top: dispSy, size: dispSize });

        const s = Math.max(cw / vw, ch / vh); // object-fit:cover scale
        const videoSize = dispSize / s;

        const scale = Math.min(1, finalProps.maxDecodeWidth / videoSize);
        canvas.width = Math.round(videoSize * scale);
        canvas.height = Math.round(videoSize * scale);

        ctx.filter = `contrast(${finalProps.contrast}%) brightness(${finalProps.brightness}%)`;
        ctx.drawImage(
            videoRef,
            (vw - videoSize) / 2,
            (vh - videoSize) / 2,
            videoSize,
            videoSize,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        try {
            const decodeResult = await codeReader.decodeFromCanvas(canvas);
            // appToast.info(decodeResult.getText());
            props.onResult(decodeResult.getText());
        } catch (err) {
            if (!(err instanceof NotFoundException)) {
                // appToast.error(err instanceof Error ? err.message : String(err));
                props.onError(err);
            }
        } finally {
            busy = false;
        }
    };

    const getStream = (deviceId: string | null) =>
        navigator.mediaDevices.getUserMedia({
            video: deviceId
                ? {
                      deviceId: { exact: deviceId },
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                      frameRate: { ideal: 30 },
                  }
                : {
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                      frameRate: { ideal: 30 },
                      facingMode: "environment",
                  },
        });

    const applyStream = (stream: MediaStream, requestedDeviceId: string | null) => {
        if (videoRef) videoRef.srcObject = stream;
        currentDeviceId =
            stream.getVideoTracks()[0]?.getSettings().deviceId ?? requestedDeviceId;
        timer = window.setInterval(tick, finalProps.interval);
    };

    const startStream = async (deviceId: string | null) => {
        const previousDeviceId = currentDeviceId;
        const oldStream = videoRef?.srcObject as MediaStream | null;
        if (timer) clearInterval(timer);
        oldStream?.getTracks().forEach((t) => t.stop());

        try {
            applyStream(await getStream(deviceId), deviceId);
        } catch (error) {
            if (previousDeviceId) {
                try {
                    applyStream(await getStream(previousDeviceId), previousDeviceId);
                } catch {
                    // Keep the original switch error if the old camera cannot be restored.
                }
            }
            throw error;
        }
    };

    onMount(async () => {
        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!navigator.mediaDevices?.getUserMedia) {
            props.onError(
                Object.assign(new Error("Camera API unavailable"), { name: "NotSupportedError" }),
            );
            return;
        }
        try {
            const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
            setDevices(videoInputDevices);
            const defaultId =
                (lastDeviceId() &&
                    videoInputDevices.find((d) => d.deviceId === lastDeviceId())?.deviceId) ??
                videoInputDevices[0]?.deviceId ??
                null;
            await startStream(defaultId);
            setDevices(
                await BrowserMultiFormatReader.listVideoInputDevices().catch(
                    () => videoInputDevices,
                ),
            );
        } catch (err) {
            // appToast.error("Could not access camera devices.");
            props.onError(err);
        }
    });

    const handleDeviceChange = async (deviceId: string) => {
        try {
            await startStream(deviceId);
            setLastDeviceId(deviceId);
        } catch (err) {
            props.onError(err);
        }
    };

    const getCameraLabel = (device: MediaDeviceInfo) => {
        const label = device.label.trim();
        const normalized = label.toLowerCase();
        if (/\b(front|user|facetime)\b/.test(normalized)) return t("camera.front");
        if (/\b(back|rear|environment)\b/.test(normalized)) return t("camera.back");
        if (/\b(external|usb)\b/.test(normalized)) return t("camera.external");
        return label || t("camera.cameraLabel", { id: device.deviceId.slice(0, 6) });
    };

    onCleanup(() => {
        if (timer) clearInterval(timer);
        const stream = videoRef?.srcObject as MediaStream | null;
        stream?.getTracks().forEach((t) => t.stop());
    });

    return (
        <div class="h-full relative">
            <video
                ref={videoRef}
                class="h-full w-full object-cover"
                style={{
                    filter: `contrast(${finalProps.contrast}%) brightness(${finalProps.brightness}%)`,
                }}
                muted
                autoplay
                playsinline
            />

            <Show when={cropRect()}>
                {(rect) => (
                    <div
                        class="absolute pointer-events-none z-10 rounded-box"
                        style={{
                            left: `${rect().left}px`,
                            top: `${rect().top}px`,
                            width: `${rect().size}px`,
                            height: `${rect().size}px`,
                            "box-shadow": "0 0 0 9999px rgba(0,0,0,0.5)",
                        }}
                    />
                )}
            </Show>

            <Show when={devices().length > 1}>
                <div class="fab top-20 bottom-[calc(4rem+env(safe-area-inset-bottom)+5.25rem)]">
                    <div
                        tabindex="0"
                        role="button"
                        class="btn btn-lg btn-circle btn-primary btn-soft"
                        aria-label={t("camera.switchCamera")}
                    >
                        <IconCameraRotate />
                    </div>
                    <For each={devices()}>
                        {(device) => (
                            <button
                                class="btn"
                                onClick={() => void handleDeviceChange(device.deviceId)}
                            >
                                {getCameraLabel(device)}
                            </button>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}
