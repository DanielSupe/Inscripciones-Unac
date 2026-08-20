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
import { PoliciesPage, PublicHome, RegisterPage } from './routes/public-routes';
import {
  AdminHome,
  ApplicantEnrollment,
  ApplicantHome,
  ApplicantReceipt,
  StudentHome,
  StudentReceipt,
} from './routes/role-routes';
import { UsersTable } from './features/admin/components/users-table';
import { ReviewInbox } from './features/admin/components/review-inbox';
import { ReviewDetail } from './features/admin/components/review-detail';
import { PeriodsManager } from './features/admin/components/periods-manager';
import { DeanInbox } from './features/dean/components/dean-inbox';
import { DeanDetail } from './features/dean/components/dean-detail';

interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
});

/**
 * Si ya hay sesión, el ingreso y el registro no tienen sentido: se lleva a la
 * persona a su zona en vez de ofrecerle crear otra cuenta.
 *
 * Si la consulta **falla** —el API no responde— se sigue adelante hasta la
 * pantalla pública en lugar de propagar el error. Esa pantalla es justo la que
 * sabe decir que el sistema no está disponible, y dejarla en blanco convertiría
 * una caída del backend en una plataforma que no arranca. No se pierde ninguna
 * garantía: la zona protegida resuelve su propia sesión, y allí un fallo sí
 * niega el paso.
 */
export async function redirectIfAuthenticated({
  context,
}: {
  context: RouterContext;
}): Promise<void> {
  // El fallo se traduce a «no se sabe de ninguna sesión». La redirección queda
  // fuera del `catch` a propósito: se señala lanzando, y atraparla la anularía
  // en silencio.
  const session = await context.queryClient
    .ensureQueryData(sessionQueryOptions())
    .catch(() => null);

  if (session) throw redirect({ to: homePathFor(session.role) });
}

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: redirectIfAuthenticated,
  component: PublicHome,
});

const policiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/politicas',
  component: PoliciesPage,
});

/**
 * El ingreso vive ahora en la raíz. Esta ruta se conserva sin pantalla porque
 * puede estar en un marcador o en un correo, y una dirección que alguien
 * guardó no debería terminar en un 404.
 */
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ingresar',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
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
    if (!session) throw redirect({ to: '/' });
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

/** Zona de administración. El guard vive en la ruta padre y lo heredan todas. */
const adminLayout = createRoute({
  getParentRoute: () => protectedLayout,
  id: 'admin',
  beforeLoad: requireRole('ADMIN'),
});

const adminHomeRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: '/admin',
  component: function AdminScreen() {
    const { session } = protectedLayout.useRouteContext();
    return <AdminHome session={session} />;
  },
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: '/admin/usuarios',
  component: function AdminUsersScreen() {
    const { session } = protectedLayout.useRouteContext();
    return <UsersTable sessionUserId={session.id} />;
  },
});

const adminInboxRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: '/admin/aspirantes',
  component: ReviewInbox,
});

const adminDetailRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: '/admin/aspirantes/$id',
  component: function AdminDetailScreen() {
    const { id } = adminDetailRoute.useParams();
    return <ReviewDetail enrollmentId={id} />;
  },
});

const adminPeriodsRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: '/admin/periodos',
  component: PeriodsManager,
});

/** Zona de la facultad. Mismo patrón que la de administración: guard en el padre. */
const deanLayout = createRoute({
  getParentRoute: () => protectedLayout,
  id: 'facultad',
  beforeLoad: requireRole('DEAN'),
});

const deanInboxRoute = createRoute({
  getParentRoute: () => deanLayout,
  path: '/facultad',
  component: DeanInbox,
});

const deanDetailRoute = createRoute({
  getParentRoute: () => deanLayout,
  path: '/facultad/$id',
  component: function DeanDetailScreen() {
    const { id } = deanDetailRoute.useParams();
    return <DeanDetail enrollmentId={id} />;
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
    adminLayout.addChildren([
      adminHomeRoute,
      adminUsersRoute,
      adminInboxRoute,
      adminDetailRoute,
      adminPeriodsRoute,
    ]),
    deanLayout.addChildren([deanInboxRoute, deanDetailRoute]),
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
