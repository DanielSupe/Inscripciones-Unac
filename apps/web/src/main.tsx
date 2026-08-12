import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { createAppRouter } from './router';
import { onSessionExpired } from './lib/session-expiry';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createAppRouter(queryClient);

// Cuando el cliente HTTP detecta que la sesión dejó de valer, se descarta todo
// lo que había en caché —pertenecía a esa sesión— y se lleva a la persona al
// ingreso, donde el aviso pendiente explica por qué llegó ahí.
onSessionExpired(() => {
  queryClient.clear();
  void router.navigate({ to: '/' });
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento #root en index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
