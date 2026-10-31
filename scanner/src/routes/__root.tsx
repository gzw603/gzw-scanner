import { NotFound, RouteError } from "core/components/route-fallback";
import AppDock, { type DockRoute } from "@/components/app-dock";
import { IconHistory, IconScan, IconSettings } from "@tabler/icons-solidjs";
import { Outlet, createRootRoute, useMatchRoute, useNavigate } from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import { Toaster } from "solid-sonner";

import { doneOnboarding } from "@/stores/onboarding";
import { createEffect, createMemo, on, untrack } from "solid-js";
import { applyDocumentLanguage, t } from "core/i18n";
import "../styles.css";

export const Route = createRootRoute({
    component: RootComponent,
    notFoundComponent: NotFound,
    errorComponent: RouteError,
});

function RootComponent() {
    const navigate = useNavigate();
    const matchRoute = useMatchRoute();
    const appRoutes = createMemo<DockRoute[]>(() => [
        {
            name: t("nav.scan"),
            path: "/scan",
            icon: <IconScan />,
        },
        {
            name: t("nav.history"),
            path: "/history",
            icon: <IconHistory />,
        },
        {
            name: t("nav.settings"),
            path: "/settings",
            icon: <IconSettings />,
        },
    ]);

    const onboardingRedirect = (done: boolean) => {
        if (!done) {
            untrack(() => {
                if (matchRoute({ to: "/conn" })) return; // conn has its own redirect
                navigate({ to: "/" });
            });
        }
    };

    createEffect(on(doneOnboarding, onboardingRedirect));
    createEffect(applyDocumentLanguage);

    return (
        <>
            <Toaster position="top-center" />

            <main class="h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] overflow-auto">
                <Outlet />
            </main>

            <AppDock routes={appRoutes()} />

            <TanStackRouterDevtools position="bottom-right" />
        </>
    );
}
