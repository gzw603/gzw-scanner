import { createSignal, onMount, Show } from "solid-js";
import QRCode from "qrcode";
import { IconCheckFilled, IconQrcode } from "@tabler/icons-solidjs";
import { getConnectionUrl } from "core/utils/scanner-url";
import { deviceId } from "core/stores/device";
import { cn } from "core/utils/tw";
import { t } from "core/i18n";

type ConnectionQRCardProps = {
    newConnectionName?: string | null;
};

export function ConnectionQRCard(props: ConnectionQRCardProps) {
    const [qrCode, setQrCode] = createSignal("");
    const connUrl = () => getConnectionUrl(deviceId());

    onMount(() => {
        QRCode.toDataURL(connUrl(), {
            color: { dark: "#1d232a", light: "#ecfaff" },
        }).then(setQrCode);
    });

    const connected = () => props.newConnectionName!!;

    return (
        <div class="space-y-3 text-center">
            <div class="hover-3d">
                <div class="relative rounded-box">
                    <div
                        class={cn(
                            "absolute w-full h-full",
                            connected() ? "bg-success" : "bg-primary animate-pulse",
                        )}
                    ></div>
                    <img
                        src={qrCode()}
                        class="relative size-84 m-1 rounded-box"
                        alt={t("connection.qrAlt")}
                    />
                </div>

                {/* 8 empty divs needed for the 3D effect  */}
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>

            <Show
                when={connected()}
                fallback={
                    <>
                        <p class="font-medium animate-pulse flex items-center justify-center gap-2">
                            <IconQrcode class="size-4" />
                            {t("connection.waiting")}
                        </p>
                        <p class="text-sm text-base-content/60">
                            {t("connection.scanQrPrefix")}{" "}
                            <a href={connUrl()} class="link link-primary">
                                {t("app.name")}
                            </a>{" "}
                            {t("connection.scanQrSuffix")}
                        </p>
                    </>
                }
            >
                <p class="font-medium flex items-center justify-center gap-2">
                    <IconCheckFilled class="size-4" />
                    {t("connection.connectedTo", { name: props.newConnectionName ?? "" })}
                </p>
            </Show>
        </div>
    );
}
