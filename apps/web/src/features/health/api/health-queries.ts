import { useQuery } from '@tanstack/react-query';
import { healthStatusSchema, type HealthStatus } from '@repo/contracts';
import { apiFetch } from '../../../lib/http';

/** Las query keys de una feature se declaran aquí, nunca sueltas en un componente. */
export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
};

async function fetchHealthStatus(): Promise<HealthStatus> {
  // 503 no es un error aquí: es la respuesta que da el API cuando la base de
  // datos está caída, y justamente eso es lo que queremos mostrar.
  const payload = await apiFetch<unknown>('/health', { acceptStatuses: [503] });
  return healthStatusSchema.parse(payload);
}

export function useHealthStatus() {
  return useQuery({
    queryKey: healthKeys.status(),
    queryFn: fetchHealthStatus,
    retry: 1,
  });
}
