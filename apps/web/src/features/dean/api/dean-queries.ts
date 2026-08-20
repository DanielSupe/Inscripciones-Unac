import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Enrollment,
  EnrollmentStatus,
  InterviewOutcome,
  Paged,
  ReviewItem,
  ScheduleInterviewRequest,
} from '@repo/contracts';
import { apiFetch } from '../../../lib/http';

export const deanKeys = {
  all: ['dean'] as const,
  inbox: (query: DeanInboxQuery) => [...deanKeys.all, 'inbox', query] as const,
  enrollment: (id: string) => [...deanKeys.all, 'enrollment', id] as const,
};

export interface DeanInboxQuery {
  page: number;
  search?: string;
  status?: EnrollmentStatus;
}

function toSearchParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

export function useDeanInbox(query: DeanInboxQuery) {
  return useQuery({
    queryKey: deanKeys.inbox(query),
    queryFn: () => apiFetch<Paged<ReviewItem>>(`/dean/enrollments?${toSearchParams({ ...query })}`),
  });
}

export function useDeanEnrollment(id: string) {
  return useQuery({
    queryKey: deanKeys.enrollment(id),
    queryFn: () => apiFetch<Enrollment>(`/dean/enrollments/${id}`),
  });
}

/**
 * Invalida todo lo de la facultad.
 *
 * Cualquier acción sobre una inscripción cambia a la vez su detalle y su fila
 * en la bandeja; afinar cuál de las dos refrescar solo daría ocasión de
 * equivocarse.
 */
function useInvalidateDean() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: deanKeys.all });
}

export function useScheduleInterview(id: string) {
  const invalidate = useInvalidateDean();
  return useMutation({
    mutationFn: (input: ScheduleInterviewRequest) =>
      apiFetch<Enrollment>(`/dean/enrollments/${id}/interview`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => void invalidate(),
  });
}

export function useRescheduleInterview(id: string) {
  const invalidate = useInvalidateDean();
  return useMutation({
    mutationFn: (input: ScheduleInterviewRequest) =>
      apiFetch<Enrollment>(`/dean/enrollments/${id}/interview`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => void invalidate(),
  });
}

export function useDeclareOutcome(id: string) {
  const invalidate = useInvalidateDean();
  return useMutation({
    mutationFn: (outcome: InterviewOutcome) =>
      apiFetch<Enrollment>(`/dean/enrollments/${id}/interview/outcome`, {
        method: 'POST',
        body: JSON.stringify({ outcome }),
      }),
    onSuccess: () => void invalidate(),
  });
}

export function useDeanApprove(id: string) {
  const invalidate = useInvalidateDean();
  return useMutation({
    mutationFn: () => apiFetch<Enrollment>(`/dean/enrollments/${id}/approve`, { method: 'POST' }),
    onSuccess: () => void invalidate(),
  });
}

export function useDeanReject(id: string) {
  const invalidate = useInvalidateDean();
  return useMutation({
    mutationFn: (reason: string) =>
      apiFetch<Enrollment>(`/dean/enrollments/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => void invalidate(),
  });
}
