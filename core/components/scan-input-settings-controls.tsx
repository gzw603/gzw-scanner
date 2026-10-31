import { For, Show } from "solid-js";
import { t } from "../i18n";
import { normalizeKeyCombo } from "../utils/input-events";
import { shortcutButtons, updateShortcutButton } from "../stores/scan-input-settings";

export function ShortcutSettings() {
    return (
        <div class="w-full space-y-4">
            <p class="text-sm text-base-content/60">{t("shortcuts.description")}</p>
            <For each={shortcutButtons()}>
                {(shortcut, index) => {
                    const invalid = () =>
                        shortcut.combo.trim().length > 0 &&
                        normalizeKeyCombo(shortcut.combo) === null;

                    return (
                        <div class="rounded-box border border-base-300 p-3">
                            <div class="mb-2 text-sm font-semibold">
                                {t("shortcuts.slot", { index: index() + 1 })}
                            </div>
                            <div class="grid gap-2 sm:grid-cols-2">
                                <label class="form-control">
                                    <span class="label-text mb-1 text-xs">
                                        {t("shortcuts.label")}
                                    </span>
                                    <input
                                        class="input input-sm input-bordered w-full"
                                        value={shortcut.label}
                                        placeholder={t("shortcuts.labelPlaceholder")}
                                        onInput={(event) =>
                                            updateShortcutButton(index(), {
                                                label: event.currentTarget.value,
                                            })
                                        }
                                    />
                                </label>
                                <label class="form-control">
                                    <span class="label-text mb-1 text-xs">
                                        {t("shortcuts.combo")}
                                    </span>
                                    <input
                                        class="input input-sm input-bordered w-full font-mono"
                                        classList={{ "input-error": invalid() }}
                                        value={shortcut.combo}
                                        placeholder={t("shortcuts.comboPlaceholder")}
                                        aria-invalid={invalid()}
                                        onInput={(event) =>
                                            updateShortcutButton(index(), {
                                                combo: event.currentTarget.value,
                                            })
                                        }
                                    />
                                </label>
                            </div>
                            <Show when={invalid()}>
                                <p class="mt-2 text-xs text-error">{t("shortcuts.invalid")}</p>
                            </Show>
                            <Show when={!shortcut.combo.trim()}>
                                <p class="mt-2 text-xs text-base-content/50">
                                    {t("shortcuts.emptyHint")}
                                </p>
                            </Show>
                        </div>
                    );
                }}
            </For>
        </div>
    );
}

const MARKERS = [
    "{{SPACE}}",
    "{{ENTER}}",
    "{{TAB}}",
    "{{KEY:Ctrl+V}}",
    "{{KEY:Shift+Tab}}",
    "{{KEY:Backspace}}",
];

export function ScanMarkerHelp() {
    return (
        <div class="w-full space-y-3">
            <p class="text-sm text-base-content/60">{t("scanInput.markersDescription")}</p>
            <div class="flex flex-wrap gap-2">
                <For each={MARKERS}>
                    {(marker) => <code class="rounded-box bg-base-200 px-2 py-1 text-xs">{marker}</code>}
                </For>
            </div>
        </div>
    );
}
