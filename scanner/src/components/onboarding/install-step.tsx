import {
    IconBrandChrome,
    IconBrandSafari,
    IconCheck,
    IconDeviceMobile,
    IconDotsVertical,
    IconDownload,
    IconShare,
    IconSquarePlus,
} from "@tabler/icons-solidjs";
import { type BeforeInstallPromptEvent, detectPlatform, isStandalone } from "core/utils/platform";
import { createSignal, Match, onCleanup, onMount, Switch } from "solid-js";
import { t } from "core/i18n";

export function InstallStep(props: { onDone: () => void }) {
    const [installEvent, setInstallEvent] = createSignal<BeforeInstallPromptEvent | null>(null);
    const [installed, setInstalled] = createSignal(isStandalone());
    const [confirmed, setConfirmed] = createSignal(false); // manual "I've added it" ack

    const done = () => installed() || confirmed();
    const platform = () => detectPlatform(installEvent() !== null);

    const onBeforeInstall = (e: Event) => {
        e.preventDefault();
        setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    onMount(() => {
        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);
    });
    onCleanup(() => {
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        window.removeEventListener("appinstalled", onInstalled);
    });

    async function requestInstall() {
        const event = installEvent();
        if (!event) return;
        await event.prompt();
        const { outcome } = await event.userChoice;
        setInstallEvent(null);
        if (outcome === "accepted") setInstalled(true);
    }

    return (
        <div class="card card-border bg-base-100">
            <div class="card-body items-center gap-2 text-center">
                <Switch>
                    <Match when={done()}>
                        <IconCheck size={40} stroke-width={1.5} class="text-success" />
                        <h2 class="card-title">{t("onboarding.allSetTitle")}</h2>
                        <p class="text-sm text-base-content/60">
                            {t("onboarding.allSetDescription")}
                        </p>
                        <button class="btn btn-primary btn-block mt-3" onClick={props.onDone}>
                            {t("common.continue")}
                        </button>
                    </Match>

                    <Match when={platform() === "installable"}>
                        <IconBrandChrome size={40} stroke-width={1.5} />
                        <h2 class="card-title">{t("onboarding.installTitle")}</h2>
                        <p class="text-sm text-base-content/60">
                            {t("onboarding.installDescription")}
                        </p>
                        <button class="btn btn-primary btn-block mt-3" onClick={requestInstall}>
                            <IconDownload size={20} /> {t("common.installApp")}
                        </button>
                        <button class="btn btn-ghost btn-block" onClick={props.onDone}>
                            {t("common.maybeLater")}
                        </button>
                    </Match>

                    <Match when={platform() === "ios-safari"}>
                        <IconBrandSafari size={40} stroke-width={1.5} />
                        <h2 class="card-title">{t("onboarding.homeScreenTitle")}</h2>
                        <ol class="mt-1 w-full space-y-3 text-left text-sm">
                            <li>
                                <span class="badge badge-primary badge-sm mr-2">1</span>
                                {t("onboarding.iosStep1Prefix")}
                                <kbd class="kbd p-0 mx-1">
                                    <IconShare size={14} />
                                </kbd>
                                {t("onboarding.iosStep1Suffix")}
                            </li>
                            <li>
                                <span class="badge badge-primary badge-sm mr-2">2</span>
                                {t("onboarding.iosStep2Prefix")}
                                <kbd class="kbd p-0 mx-1">
                                    <IconSquarePlus size={14} />
                                </kbd>
                                {t("onboarding.iosStep2Suffix")}
                            </li>
                            <li>
                                <span class="badge badge-primary badge-sm mr-2">3</span>
                                {t("onboarding.iosStep3")}
                            </li>
                        </ol>
                        <button
                            class="btn btn-primary btn-block mt-3"
                            onClick={() => setConfirmed(true)}
                        >
                            {t("common.iveAddedIt")}
                        </button>
                        <button class="btn btn-ghost btn-block" onClick={props.onDone}>
                            {t("common.maybeLater")}
                        </button>
                    </Match>

                    <Match when={platform() === "ios-other"}>
                        <IconBrandSafari size={40} stroke-width={1.5} />
                        <h2 class="card-title">{t("onboarding.openSafariTitle")}</h2>
                        <p class="text-sm text-base-content/60">
                            {t("onboarding.openSafariDescription")}
                        </p>
                        <button class="btn btn-ghost btn-block mt-3" onClick={props.onDone}>
                            {t("onboarding.continueWithoutInstall")}
                        </button>
                    </Match>

                    <Match when={platform() === "desktop-safari"}>
                        <IconBrandSafari size={40} stroke-width={1.5} />
                        <h2 class="card-title">{t("onboarding.addToDockTitle")}</h2>
                        <ol class="mt-1 w-full space-y-3 text-left text-sm">
                            <li>
                                <span class="badge badge-primary badge-sm mr-2">1</span>
                                {t("onboarding.dockStep1Prefix")}
                                <kbd class="kbd p-0 mx-1">
                                    <IconShare size={14} />
                                </kbd>
                                {t("onboarding.dockStep1Suffix")}
                            </li>
                            <li>
                                <span class="badge badge-primary badge-sm mr-2">2</span>
                                {t("onboarding.dockStep2")}
                            </li>
                        </ol>
                        <button
                            class="btn btn-primary btn-block mt-3"
                            onClick={() => setConfirmed(true)}
                        >
                            {t("common.iveAddedIt")}
                        </button>
                        <button class="btn btn-ghost btn-block" onClick={props.onDone}>
                            {t("common.maybeLater")}
                        </button>
                    </Match>

                    <Match when={platform() === "other"}>
                        <IconDeviceMobile size={40} stroke-width={1.5} />
                        <h2 class="card-title">{t("onboarding.installTitle")}</h2>
                        <p class="text-sm text-base-content/60">
                            {t("onboarding.otherInstallDescriptionPrefix")}
                            <kbd class="kbd p-0 mx-1">
                                <IconDotsVertical size={14} />
                            </kbd>
                            {t("onboarding.otherInstallDescriptionSuffix")}
                        </p>
                        <button
                            class="btn btn-primary btn-block mt-3"
                            onClick={() => setConfirmed(true)}
                        >
                            {t("common.iveAddedIt")}
                        </button>
                        <button class="btn btn-ghost btn-block" onClick={props.onDone}>
                            {t("common.maybeLater")}
                        </button>
                    </Match>
                </Switch>
            </div>
        </div>
    );
}

export default InstallStep;
