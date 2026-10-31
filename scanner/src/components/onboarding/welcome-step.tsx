import { t } from "core/i18n";

export function WelcomeStep(props: { onNext: () => void }) {
    return (
        <div class="card card-border bg-base-100">
            <div class="card-body items-center gap-3 text-center">
                <img
                    src={import.meta.env.BASE_URL + "logoR192.png"}
                    alt={t("app.name")}
                    class="size-24"
                />
                <h2 class="card-title text-xl">{t("onboarding.welcomeTitle")}</h2>
                <p class="text-base font-medium text-base-content/80">
                    {t("onboarding.welcomeTagline")}
                </p>
                <p class="text-sm text-base-content/60">
                    {t("onboarding.welcomeDescription")}
                </p>
                <button class="btn btn-primary btn-block mt-2" onClick={props.onNext}>
                    {t("common.continue")}
                </button>
            </div>
        </div>
    );
}

export default WelcomeStep;
