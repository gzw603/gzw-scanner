import { NotFound, RouteError } from "core/components/route-fallback";
import { IconDeviceCameraPhone, IconHistory, IconSettings } from "@tabler/icons-solidjs";
import { Outlet, createRootRoute } from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import Sidebar, { type SidebarRoute } from "../components/sidebar";

import "../styles.css";
import { Toaster } from "solid-sonner";
import { createEffect, createMemo } from "solid-js";
import { applyDocumentLanguage, t } from "core/i18n";

export const Route = createRootRoute({
    component: RootComponent,
    notFoundComponent: NotFound,
    errorComponent: RouteError,
});

function RootComponent() {
    const appRoutes = createMemo<SidebarRoute[]>(() => [
        {
            name: t("nav.devices"),
            path: "/scanners",
            icon: <IconDeviceCameraPhone />,
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

    createEffect(applyDocumentLanguage);

    return (
        <>
            <Toaster position="bottom-right" />
            <Sidebar routes={appRoutes()}>
                <Outlet />
            </Sidebar>
            <TanStackRouterDevtools position="bottom-right" />
        </>
    );
}
