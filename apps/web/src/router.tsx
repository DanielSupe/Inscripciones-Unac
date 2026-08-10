import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { Role, SessionUser } from '@repo/contracts';
import { homePathFor, sessionQueryOptions } from './features/auth/api/auth-queries';
import { AppShell } from './components/app-shell';
import { LoginPage, PoliciesPage, PublicHome, RegisterPage } from './routes/public-routes';
import { AdminHome, ApplicantHome, StudentHome } from './routes/role-routes';

interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
});

/**
 * Si ya hay sesión, el ingreso y el registro no tienen sentido: se lleva a la
 * persona a su zona en vez de ofrecerle crear otra cuenta.
 */
async function redirectIfAuthenticated({ context }: { context: RouterContext }): Promise<void> {
  const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
  if (session) throw redirect({ to: homePathFor(session.role) });
}

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: PublicHome,
});

const policiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/politicas',
  component: PoliciesPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ingresar',
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/registro',
  beforeLoad: redirectIfAuthenticated,
  component: RegisterPage,
});

/**
 * Zona autenticada.
 *
 * La sesión se resuelve aquí, **antes** de montar ningún componente hijo, de
 * modo que el contenido protegido no llega a renderizarse nunca para quien no
 * debe verlo. Ocultarlo después de pintarlo no sería protección.
 */
const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protegido',
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session) throw redirect({ to: '/ingresar' });
    return { session };
  },
  component: function ProtectedLayout() {
    const { session } = protectedLayout.useRouteContext();
    return <AppShell session={session} />;
  },
});

/** Deniega el paso a quien no tenga el rol de esta zona y lo devuelve a la suya. */
function requireRole(role: Role) {
  return ({ context }: { context: { session: SessionUser } }): void => {
    if (context.session.role !== role) {
      throw redirect({ to: homePathFor(context.session.role) });
    }
  };
}

const applicantRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/aspirante',
  beforeLoad: requireRole('APPLICANT'),
  component: function ApplicantScreen() {
    const { session } = protectedLayout.useRouteContext();
    return <ApplicantHome session={session} />;
  },
});

const studentRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/estudiante',
  beforeLoad: requireRole('STUDENT'),
  component: function StudentScreen() {
    const { session } = protectedLayout.useRouteContext();
    return <StudentHome session={session} />;
  },
});

const adminRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/admin',
  beforeLoad: requireRole('ADMIN'),
  component: function AdminScreen() {
    const { session } = protectedLayout.useRouteContext();
    return <AdminHome session={session} />;
  },
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  policiesRoute,
  loginRoute,
  registerRoute,
  protectedLayout.addChildren([applicantRoute, studentRoute, adminRoute]),
]);

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: false,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
