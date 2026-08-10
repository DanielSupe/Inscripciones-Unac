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
import {
  AdminHome,
  ApplicantEnrollment,
  ApplicantHome,
  ApplicantReceipt,
  StudentHome,
  StudentReceipt,
} from './routes/role-routes';

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

/**
 * Zona del aspirante. El guard vive en la ruta padre, así que las hijas lo
 * heredan y no hay forma de añadir una pantalla sin protegerla.
 */
const applicantLayout = createRoute({
  getParentRoute: () => protectedLayout,
  id: 'aspirante',
  beforeLoad: requireRole('APPLICANT'),
});

const applicantHomeRoute = createRoute({
  getParentRoute: () => applicantLayout,
  path: '/aspirante',
  component: ApplicantHome,
});

const applicantEnrollmentRoute = createRoute({
  getParentRoute: () => applicantLayout,
  path: '/aspirante/inscripcion',
  component: ApplicantEnrollment,
});

const applicantReceiptRoute = createRoute({
  getParentRoute: () => applicantLayout,
  path: '/aspirante/recibo',
  component: ApplicantReceipt,
});

const studentLayout = createRoute({
  getParentRoute: () => protectedLayout,
  id: 'estudiante',
  beforeLoad: requireRole('STUDENT'),
});

const studentHomeRoute = createRoute({
  getParentRoute: () => studentLayout,
  path: '/estudiante',
  component: StudentHome,
});

const studentReceiptRoute = createRoute({
  getParentRoute: () => studentLayout,
  path: '/estudiante/recibo',
  component: StudentReceipt,
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
  protectedLayout.addChildren([
    applicantLayout.addChildren([
      applicantHomeRoute,
      applicantEnrollmentRoute,
      applicantReceiptRoute,
    ]),
    studentLayout.addChildren([studentHomeRoute, studentReceiptRoute]),
    adminRoute,
  ]),
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
