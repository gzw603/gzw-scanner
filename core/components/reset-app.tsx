import { createSignal, onCleanup, Show, type JSX } from "solid-js";
import { clear as clearIdb } from "idb-keyval";
import { Modal } from "./modal";
import { t } from "../i18n";

type Props = {
    baseUrl: string;
};

export default function ResetApp(props: Props) {
    const [showModal, setShowModal] = createSignal(false);
    const [holding, setHolding] = createSignal(false);

    let timer: number | undefined;

    const reset = async () => {
        localStorage.clear();
        await clearIdb();
        window.location.replace(props.baseUrl);
    };

    const startHold: JSX.EventHandler<HTMLButtonElement, PointerEvent> = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);

        setHolding(true);

        timer = window.setTimeout(() => {
            reset();
        }, 2000);
    };

    const cancelHold = () => {
        setHolding(false);

        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
    };

    onCleanup(cancelHold);

    return (
        <>
            <button class="btn btn-sm btn-error" onClick={() => setShowModal(true)}>
                {t("reset.title")}
            </button>

            <Modal
                open={showModal()}
                onClose={() => {
                    cancelHold();
                    setShowModal(false);
                }}
                title={t("reset.title")}
            >
                <p>
                    {t("reset.confirmPrefix")}{" "}
                    <span class="text-error font-bold">{t("reset.confirmReset")}</span>{" "}
                    {t("reset.confirmMiddle")}{" "}
                    <span class="text-error font-bold">{t("reset.confirmIrreversible")}</span>{" "}
                    {t("reset.confirmSuffix")}
                </p>

                <button
                    class="btn btn-error btn-sm mt-8 btn-outline uppercase"
                    onPointerDown={startHold}
                    onPointerUp={cancelHold}
                    onPointerLeave={cancelHold}
                    onPointerCancel={cancelHold}
                    onLostPointerCapture={cancelHold}
                >
                    <Show when={holding()} fallback={t("reset.hold")}>
                        {t("reset.holding")}
                    </Show>
                </button>
            </Modal>
        </>
    );
}
