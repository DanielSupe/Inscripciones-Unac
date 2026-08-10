// La configuración se importa antes que nada: si el entorno está mal, el
// proceso muere aquí y no llega a abrir un puerto ni una conexión.
import { env } from '@repo/config/server';
import { createApp } from './app';

const app = createApp();

app.listen(env.PORT, () => {
  console.warn(`API escuchando en http://localhost:${String(env.PORT)} (${env.NODE_ENV})`);
});
