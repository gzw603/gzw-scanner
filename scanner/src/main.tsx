import { render } from 'solid-js/web'
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/solid-router'
import { routeTree } from './routeTree.gen'

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

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  render(() => <RouterProvider router={router} />, rootElement)
}
