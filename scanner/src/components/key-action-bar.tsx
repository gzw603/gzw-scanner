import { For } from "solid-js";
import { sendKey } from "core/stores/peer-connection";
import { localizeError, t } from "core/i18n";
import { normalizeKeyCombo } from "core/utils/input-events";
import { shortcutButtons } from "@/stores/scanner-settings";
import appToast from "core/components/app-toast";

const FIXED_ACTIONS = [
    { labelKey: "scan.space" as const, combo: "Space" },
    { labelKey: "scan.enter" as const, combo: "Enter" },
    { labelKey: "scan.tab" as const, combo: "Tab" },
];

export function KeyActionBar() {
    const customActions = () =>
        shortcutButtons().flatMap((shortcut, index) => {
            const combo = normalizeKeyCombo(shortcut.combo);
            return combo ? [{ ...shortcut, combo, index }] : [];
        });

    const press = (combo: string) => {
        void sendKey(combo).catch((error) => {
            appToast.error(t("scan.sendFailed", { error: localizeError(error) }));
        });
    };

    return (
        <section class="shrink-0 border-t border-base-300 bg-base-100 px-2 py-2">
            <div class="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                {t("scan.actions")}
            </div>
            <div class="flex gap-2 overflow-x-auto pb-1">
                <For each={FIXED_ACTIONS}>
                    {(action) => (
                        <button
                            type="button"
                            class="btn btn-sm btn-outline shrink-0"
                            onClick={() => press(action.combo)}
                        >
                            {t(action.labelKey)}
                        </button>
                    )}
                </For>
                <For each={customActions()}>
                    {(action) => (
                        <button
                            type="button"
                            class="btn btn-sm btn-secondary btn-outline shrink-0"
                            title={action.combo}
                            onClick={() => press(action.combo)}
                        >
                            <span>{action.label || t("scan.customShortcut", { index: action.index + 1 })}</span>
                            <kbd class="kbd kbd-xs">{action.combo}</kbd>
                        </button>
                    )}
                </For>
            </div>
        </section>
    );
}
