import { createSignal, Match, Switch } from "solid-js";
import { IconCamera, IconCheck } from "@tabler/icons-solidjs";
import { t } from "core/i18n";

type CameraStatus = "idle" | "granted" | "denied";

export function CameraStep(props: { onNext: () => void }) {
    const [status, setStatus] = createSignal<CameraStatus>("idle");

    async function requestCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop()); // only checking permission
            setStatus("granted");
        } catch {
            setStatus("denied");
        }
    }

    return (
        <div class="card card-border bg-base-100">
            <div class="card-body items-center gap-1 text-center">
                <Switch>
                    <Match when={status() === "idle"}>
                        <IconCamera size={40} stroke-width={1.5} />
                        <h2 class="card-title">{t("onboarding.cameraEnableTitle")}</h2>
                        <p class="text-sm text-base-content/60">
                            {t("onboarding.cameraEnableDescription")}
                        </p>
                        <button class="btn btn-primary btn-block mt-3" onClick={requestCamera}>
                            {t("onboarding.cameraEnableButton")}
                        </button>
                    </Match>

                    <Match when={status() === "granted"}>
                        <IconCheck size={40} stroke-width={1.5} class="text-success" />
                        <h2 class="card-title">{t("onboarding.cameraEnabledTitle")}</h2>
                        <button class="btn btn-primary btn-block mt-3" onClick={props.onNext}>
                            {t("common.continue")}
                        </button>
                    </Match>

                    <Match when={status() === "denied"}>
                        <IconCamera size={40} stroke-width={1.5} class="text-warning" />
                        <h2 class="card-title">{t("onboarding.cameraBlockedTitle")}</h2>
                        <p class="text-sm text-base-content/60">
                            {t("onboarding.cameraBlockedDescription")}
                        </p>
                        <button class="btn btn-primary btn-block mt-3" onClick={requestCamera}>
                            {t("common.retry")}
                        </button>
                        <button class="btn btn-ghost btn-block" onClick={props.onNext}>
                            {t("common.skipForNow")}
                        </button>
                    </Match>
                </Switch>
            </div>
        </div>
    );
}

export default CameraStep;
