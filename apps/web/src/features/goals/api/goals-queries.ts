import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FacultyGoalRow, SetFacultyGoalRequest } from '@repo/contracts';
import { apiFetch } from '../../../lib/http';

export const goalsKeys = {
  all: ['admin', 'faculty-goals'] as const,
};

export function useFacultyGoals() {
  return useQuery({
    queryKey: goalsKeys.all,
    queryFn: () => apiFetch<FacultyGoalRow[]>('/admin/faculty-goals'),
  });
}

function useInvalidateGoals() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: goalsKeys.all });
}

export function useSetFacultyGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ facultyId, target }: { facultyId: string } & SetFacultyGoalRequest) =>
      apiFetch<null>(`/admin/faculty-goals/${facultyId}`, {
        method: 'PUT',
        body: JSON.stringify({ target }),
      }),
    onSuccess: () => void invalidate(),
  });
}

export function useClearFacultyGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (facultyId: string) =>
      apiFetch<null>(`/admin/faculty-goals/${facultyId}`, { method: 'DELETE' }),
    onSuccess: () => void invalidate(),
  });
}
