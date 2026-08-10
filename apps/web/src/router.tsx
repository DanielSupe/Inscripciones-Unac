import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { HomePage } from './routes/home-route';

const rootRoute = createRootRoute({
  component: Outlet,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const routeTree = rootRoute.addChildren([homeRoute]);

export const router = createRouter({ routeTree });

// Le da a TanStack Router los tipos de este árbol concreto, de modo que las
// rutas y sus parámetros queden comprobados en tiempo de compilación.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
