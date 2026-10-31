import AboutApp from "core/components/about-app";
import ResetApp from "core/components/reset-app";
import { Settings, type SettingSection } from "core/components/settings";
import { t, preferredLocale, setPreferredLocale, type LocalePreference } from "core/i18n";
import { deviceName, deviceId, setDeviceName } from "core/stores/device";
import { maxHistoryLength, setMaxHistoryLength } from "core/stores/history";
import { createMemo, untrack } from "solid-js";

export default function ReceiverSettings() {
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
                {
                    id: "device-id",
                    label: t("settings.deviceId"),
                    type: "input",
                    readOnly: true,
                    value: untrack(deviceId),
                    onChange: () => void {},
                },
            ],
        },
        {
            title: t("settings.advanced"),
            settings: [
                {
                    id: "history-length",
                    label: t("settings.historyLength"),
                    description: t("settings.historyLengthDescription"),
                    type: "slider",
                    position: "inline",
                    min: 50,
                    max: 500,
                    step: 10,
                    value: untrack(maxHistoryLength),
                    onChange: setMaxHistoryLength,
                    displayValue: () => t("settings.entries", { count: maxHistoryLength() }),
                },
                {
                    id: "reset-app",
                    label: t("settings.resetApp"),
                    type: "custom",
                    position: "inline",
                    render: () => <ResetApp baseUrl={import.meta.env.BASE_URL} />,
                },
            ],
        },
        {
            title: t("settings.about"),
            settings: [
                {
                    id: "about",
                    type: "custom",
                    render: () => (
                        <AboutApp
                            appName={t("app.name")}
                            appSuperName={t("role.receiver")}
                            shortDescription={t("about.receiverDescription")}
                            version={import.meta.env.VITE_APP_VERSION}
                            logo="logoR192.png"
                            license="MIT"
                            licenseUrl="https://github.com/gzw603/gzw-scanner/blob/main/LICENSE"
                            githubUrl="https://github.com/gzw603/gzw-scanner"
                        />
                    ),
                },
            ],
        },
    ]);

    return <Settings sections={sections()} />;
}
