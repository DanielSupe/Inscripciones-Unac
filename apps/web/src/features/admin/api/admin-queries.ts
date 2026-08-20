import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreatePeriodRequest,
  CreateUserRequest,
  Enrollment,
  EnrollmentStatus,
  ManagedPeriod,
  ManagedUser,
  Paged,
  ReviewItem,
  Role,
  UpdatePeriodRequest,
  UpdateUserRequest,
} from '@repo/contracts';
import { apiFetch } from '../../../lib/http';

export const adminKeys = {
  all: ['admin'] as const,
  users: (query: UsersQuery) => [...adminKeys.all, 'users', query] as const,
  inbox: (query: InboxQuery) => [...adminKeys.all, 'inbox', query] as const,
  enrollment: (id: string) => [...adminKeys.all, 'enrollment', id] as const,
  periods: () => [...adminKeys.all, 'periods'] as const,
};

export interface UsersQuery {
  page: number;
  search?: string;
  role?: Role;
}

export interface InboxQuery {
  page: number;
  search?: string;
  status?: EnrollmentStatus;
  periodId?: string;
}

/** Convierte la consulta en cadena de búsqueda, omitiendo lo que no se filtró. */
function toSearchParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

// ─── Cuentas ─────────────────────────────────────────────────────────────────

export function useUsers(query: UsersQuery) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => apiFetch<Paged<ManagedUser>>(`/admin/users?${toSearchParams({ ...query })}`),
  });
}

/** Invalida todo lo del panel: una cuenta tocada puede aparecer en varias listas. */
function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: adminKeys.all });
}

export function useCreateUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: CreateUserRequest) =>
      apiFetch<ManagedUser>('/admin/users', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateUser(id: string) {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: UpdateUserRequest) =>
      apiFetch<ManagedUser>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: string) => apiFetch<null>(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => void invalidate(),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiFetch<null>(`/admin/users/${id}/password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
  });
}

// ─── Bandeja de revisión ─────────────────────────────────────────────────────

export function useInbox(query: InboxQuery) {
  return useQuery({
    queryKey: adminKeys.inbox(query),
    queryFn: () => apiFetch<Paged<ReviewItem>>(`/admin/enrollments?${toSearchParams({ ...query })}`),
  });
}

export function useEnrollmentDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.enrollment(id),
    queryFn: () => apiFetch<Enrollment>(`/admin/enrollments/${id}`),
  });
}

/** Las cuatro acciones sobre una inscripción comparten forma y refresco. */
function useEnrollmentAction<TInput = void>(id: string, path: string) {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: TInput) =>
      apiFetch<Enrollment>(`/admin/enrollments/${id}/${path}`, {
        method: 'POST',
        ...(input === undefined ? {} : { body: JSON.stringify(input) }),
      }),
    onSuccess: () => void invalidate(),
  });
}

export function useTakeForReview(id: string) {
  return useEnrollmentAction(id, 'take');
}

/**
 * Entregar a la facultad.
 *
 * Sustituye a la antigua aprobación del administrador: la decisión académica es
 * del decano, y lo que el administrador cierra es el trámite.
 */
export function useHandOver(id: string) {
  return useEnrollmentAction(id, 'hand-over');
}

export function useReject(id: string) {
  return useEnrollmentAction<{ reason: string }>(id, 'reject');
}

export function useVerifyPayment(id: string) {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (verified: boolean) =>
      apiFetch<null>(`/admin/enrollments/${id}/payment/${verified ? 'verify' : 'unverify'}`, {
        method: 'POST',
      }),
    onSuccess: () => void invalidate(),
  });
}

// ─── Periodos académicos ─────────────────────────────────────────────────────

export function usePeriods() {
  return useQuery({
    queryKey: adminKeys.periods(),
    queryFn: () => apiFetch<ManagedPeriod[]>('/admin/periods'),
  });
}

export function useCreatePeriod() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: CreatePeriodRequest) =>
      apiFetch<ManagedPeriod>('/admin/periods', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdatePeriod(id: string) {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: UpdatePeriodRequest) =>
      apiFetch<ManagedPeriod>(`/admin/periods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => void invalidate(),
  });
}
