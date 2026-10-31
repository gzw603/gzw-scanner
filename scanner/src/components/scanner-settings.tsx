import ResetApp from "core/components/reset-app";
import { Settings, type SettingSection } from "core/components/settings";
import { t, preferredLocale, setPreferredLocale, type LocalePreference } from "core/i18n";
import { deviceName, setDeviceName } from "core/stores/device";
import { createMemo, untrack } from "solid-js";
import {
    camBrightness,
    camContrast,
    scanRatio,
    setCamBrightness,
    setCamContrast,
    setScanRatio,
} from "@/stores/scanner-settings";

export default function ScannerSettings() {
    const sections = createMemo<SettingSection[]>(() => [
        {
            title: t("settings.general"),
            settings: [
                {
                    id: "language",
                    label: t("language.title"),
                    description: t("language.description"),
                    type: "select",
                    value: preferredLocale(),
                    onChange: (value) => setPreferredLocale(value as LocalePreference),
                    options: [
                        { value: "system", label: t("language.system") },
                        { value: "zh", label: t("language.zh") },
                        { value: "en", label: t("language.en") },
                    ],
                },
                {
                    id: "device-name",
                    label: t("settings.deviceName"),
                    type: "input",
                    value: untrack(deviceName),
                    onChange: setDeviceName,
                },
            ],
        },
        {
            title: t("settings.camera"),
            settings: [
                {
                    id: "scan-ratio",
                    label: t("settings.scanRatio"),
                    description: t("settings.scanRatioDescription"),
                    type: "slider",
                    position: "inline",
                    min: 0.3,
                    max: 1,
                    step: 0.05,
                    value: untrack(scanRatio),
                    onChange: setScanRatio,
                    displayValue: () => `${Math.round(scanRatio() * 100)}%`,
                },
                {
                    id: "cam-contrast",
                    label: t("settings.contrast"),
                    type: "slider",
                    position: "inline",
                    min: 0,
                    max: 200,
                    step: 10,
                    value: untrack(camContrast),
                    onChange: setCamContrast,
                    displayValue: () => `${camContrast()}%`,
                },
                {
                    id: "cam-brightness",
                    label: t("settings.brightness"),
                    type: "slider",
                    position: "inline",
                    min: 0,
                    max: 200,
                    step: 10,
                    value: untrack(camBrightness),
                    onChange: setCamBrightness,
                    displayValue: () => `${camBrightness()}%`,
                },
            ],
        },
        {
            title: t("settings.advanced"),
            settings: [
                {
                    id: "reset-app",
                    label: t("settings.resetApp"),
                    type: "custom",
                    position: "inline",
                    render: () => <ResetApp baseUrl={import.meta.env.BASE_URL} />,
                },
            ],
        },
    ]);

    return (
        <div class="space-y-4">
            <p class="rounded-box bg-base-200 p-3 text-sm text-base-content/70">
                {t("settings.desktopManagedHint")}
            </p>
            <Settings sections={sections()} />
        </div>
    );
}
