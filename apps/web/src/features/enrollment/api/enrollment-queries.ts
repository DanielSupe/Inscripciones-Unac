import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AttachmentType,
  Catalog,
  Enrollment,
  EnrollmentDraft,
  Receipt,
  UploadTicket,
} from '@repo/contracts';
import { apiFetch } from '../../../lib/http';
import { uploadToStorage } from '../../../lib/upload';

export const enrollmentKeys = {
  all: ['enrollment'] as const,
  current: () => [...enrollmentKeys.all, 'current'] as const,
  receipt: (id: string) => [...enrollmentKeys.all, id, 'receipt'] as const,
  catalog: () => ['catalog'] as const,
};

export function catalogQueryOptions() {
  return queryOptions({
    queryKey: enrollmentKeys.catalog(),
    queryFn: () => apiFetch<Catalog>('/catalog'),
    staleTime: 5 * 60_000,
  });
}

export function useCatalog() {
  return useQuery(catalogQueryOptions());
}

export function useCurrentEnrollment() {
  return useQuery({
    queryKey: enrollmentKeys.current(),
    queryFn: () => apiFetch<Enrollment | null>('/enrollments/current'),
  });
}

export function useStartEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<Enrollment>('/enrollments', { method: 'POST' }),
    onSuccess: (enrollment) => {
      queryClient.setQueryData(enrollmentKeys.current(), enrollment);
    },
  });
}

export function useSaveDraft(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: EnrollmentDraft) =>
      apiFetch<Enrollment>(`/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        body: JSON.stringify(draft),
      }),
    onSuccess: (enrollment) => {
      queryClient.setQueryData(enrollmentKeys.current(), enrollment);
    },
  });
}

export function useSubmitEnrollment(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<Enrollment>(`/enrollments/${enrollmentId}/submit`, { method: 'POST' }),
    onSuccess: (enrollment) => {
      queryClient.setQueryData(enrollmentKeys.current(), enrollment);
    },
  });
}

export function useReopenEnrollment(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<Enrollment>(`/enrollments/${enrollmentId}/reopen`, { method: 'POST' }),
    onSuccess: (enrollment) => {
      queryClient.setQueryData(enrollmentKeys.current(), enrollment);
    },
  });
}

/**
 * Sube un documento en los tres pasos que exige el diseño.
 *
 * El archivo va del navegador al almacenamiento sin tocar nuestro backend; este
 * solo autoriza antes y toma nota después. Si la confirmación no llegara, el
 * documento no constaría como adjunto, que es el comportamiento correcto.
 */
export function useUploadDocument(enrollmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, file }: { type: AttachmentType; file: File }) => {
      const descriptor = { type, contentType: file.type, sizeBytes: file.size };

      const ticket = await apiFetch<UploadTicket>(
        `/enrollments/${enrollmentId}/documents/upload-ticket`,
        { method: 'POST', body: JSON.stringify(descriptor) },
      );

      await uploadToStorage(ticket.url, file);

      await apiFetch<null>(`/enrollments/${enrollmentId}/documents/confirm`, {
        method: 'POST',
        body: JSON.stringify(descriptor),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.current() });
    },
  });
}

export function useReceipt(enrollmentId: string, enabled: boolean) {
  return useQuery({
    queryKey: enrollmentKeys.receipt(enrollmentId),
    queryFn: () => apiFetch<Receipt>(`/enrollments/${enrollmentId}/receipt`),
    enabled,
  });
}
