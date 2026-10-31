import { invoke, isTauri } from "@tauri-apps/api/core";
import { IconRefresh } from "@tabler/icons-solidjs";
import { For, Show, createSignal, onMount } from "solid-js";
import appToast from "core/components/app-toast";
import { Modal } from "core/components/modal";
import { localizeError, t } from "core/i18n";

type WindowTarget = {
    id: string;
    title: string;
};

export default function TargetWindowSettings() {
    const desktop = isTauri() || "__TAURI_INTERNALS__" in window;
    const [target, setTarget] = createSignal<WindowTarget | null>(null);
    const [pickerOpen, setPickerOpen] = createSignal(false);
    const [windows, setWindows] = createSignal<WindowTarget[]>([]);
    const [loading, setLoading] = createSignal(false);

    const refreshWindows = async () => {
        if (!desktop) return;
        setLoading(true);
        try {
            setWindows(await invoke<WindowTarget[]>("list_target_windows"));
        } catch (error) {
            appToast.error(t("targetWindow.loadFailed", { error: localizeError(error) }));
        } finally {
            setLoading(false);
        }
    };

    onMount(() => {
        if (!desktop) return;
        void invoke<WindowTarget | null>("get_target_window")
            .then(setTarget)
            .catch(() => undefined);
    });

    const openPicker = () => {
        if (!desktop) return;
        setPickerOpen(true);
        void refreshWindows();
    };

    const selectTarget = async (window: WindowTarget) => {
        try {
            const locked = await invoke<WindowTarget>("lock_target_window", { id: window.id });
            setTarget(locked);
            setPickerOpen(false);
            appToast.success(t("targetWindow.locked", { title: locked.title }));
        } catch (error) {
            appToast.error(t("targetWindow.lockFailed", { error: localizeError(error) }));
        }
    };

    const clearTarget = async () => {
        try {
            await invoke("clear_target_window");
            setTarget(null);
            appToast.info(t("targetWindow.cleared"));
        } catch (error) {
            appToast.error(t("targetWindow.lockFailed", { error: localizeError(error) }));
        }
    };

    return (
        <Show
            when={desktop}
            fallback={
                <p class="rounded-box bg-base-200 p-4 text-sm text-base-content/60">
                    {t("targetWindow.desktopOnly")}
                </p>
            }
        >
            <div class="space-y-3">
                <div class="rounded-box bg-base-200 p-3">
                    <p class="font-medium">
                        {target()
                            ? t("targetWindow.current", { title: target()!.title })
                            : t("targetWindow.followCurrent")}
                    </p>
                    <p class="mt-1 text-sm text-base-content/60">{t("targetWindow.hint")}</p>
                </div>

                <div class="flex flex-wrap gap-2">
                    <button type="button" class="btn btn-primary btn-sm" onClick={openPicker}>
                        {target() ? t("targetWindow.change") : t("targetWindow.select")}
                    </button>
                    <Show when={target()}>
                        <button type="button" class="btn btn-ghost btn-sm" onClick={clearTarget}>
                            {t("targetWindow.clear")}
                        </button>
                    </Show>
                </div>
            </div>

            <Modal
                open={pickerOpen()}
                onClose={() => setPickerOpen(false)}
                title={t("targetWindow.selectTitle")}
            >
                <p class="mb-3 text-sm text-base-content/60">{t("targetWindow.selectDescription")}</p>
                <div class="mb-3 flex justify-end">
                    <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        disabled={loading()}
                        onClick={() => void refreshWindows()}
                    >
                        <IconRefresh class={loading() ? "size-4 animate-spin" : "size-4"} />
                        {t("targetWindow.refresh")}
                    </button>
                </div>

                <Show
                    when={windows().length > 0}
                    fallback={
                        <p class="rounded-box bg-base-200 p-4 text-sm text-base-content/60">
                            {loading() ? t("targetWindow.loading") : t("targetWindow.empty")}
                        </p>
                    }
                >
                    <ul class="max-h-80 space-y-1 overflow-auto">
                        <For each={windows()}>
                            {(window) => (
                                <li>
                                    <button
                                        type="button"
                                        class="w-full rounded-box px-3 py-2 text-left hover:bg-base-200"
                                        onClick={() => void selectTarget(window)}
                                    >
                                        <span class="line-clamp-2 break-all">{window.title}</span>
                                    </button>
                                </li>
                            )}
                        </For>
                    </ul>
                </Show>
            </Modal>
        </Show>
    );
}
