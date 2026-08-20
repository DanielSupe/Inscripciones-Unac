import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sessionUserSchema,
  type LoginRequest,
  type RegisterRequest,
  type Role,
  type SessionUser,
} from '@repo/contracts';
import { apiFetch } from '../../../lib/http';

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

/**
 * Identidad de quien tiene la sesión abierta, o null si no hay ninguna.
 *
 * Acepta el 401 a propósito: para esta consulta «no hay sesión» es una
 * respuesta legítima, no un fallo. Si no lo aceptara, abrir la aplicación sin
 * haber entrado nunca dispararía el aviso de sesión caducada.
 */
async function fetchSession(): Promise<SessionUser | null> {
  const payload = await apiFetch<unknown>('/auth/me', { acceptStatuses: [401] });
  const parsed = sessionUserSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: fetchSession,
    // La sesión la resuelve el router en cada navegación; reintentar aquí solo
    // retrasaría la redirección al ingreso.
    retry: false,
    staleTime: 60_000,
  });
}

/** Ruta de inicio de cada rol. Un solo sitio donde vive esa correspondencia. */
export function homePathFor(role: Role): '/aspirante' | '/estudiante' | '/admin' | '/facultad' {
  switch (role) {
    case 'APPLICANT':
      return '/aspirante';
    case 'STUDENT':
      return '/estudiante';
    case 'ADMIN':
      return '/admin';
    case 'DEAN':
      return '/facultad';
  }
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterRequest) =>
      apiFetch<SessionUser>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginRequest) =>
      apiFetch<SessionUser>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (user) => {
      // La identidad recién obtenida se siembra en la caché para que el guard
      // del router no tenga que volver a pedirla.
      queryClient.setQueryData(authKeys.session(), user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<null>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      // Se borra todo, no solo la sesión: cualquier dato en caché pertenecía a
      // la persona que acaba de salir.
      queryClient.clear();
    },
  });
}
