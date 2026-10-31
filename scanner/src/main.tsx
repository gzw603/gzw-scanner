import { render } from 'solid-js/web'
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/solid-router'
import { routeTree } from './routeTree.gen'
import { onData } from 'core/stores/peer-connection'
import { applyScanInputSettings, isScanInputSettings } from 'core/stores/scan-input-settings'

const hashHistory = createHashHistory()

const router = createRouter({
  history: hashHistory,
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultViewTransition: true
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

onData((_conn, data) => {
  if (data.type === 'scan-input-settings' && isScanInputSettings(data.settings)) {
    applyScanInputSettings(data.settings)
  }
})

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  render(() => <RouterProvider router={router} />, rootElement)
}
