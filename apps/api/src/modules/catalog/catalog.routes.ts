import { Router } from 'express';
import * as catalogController from './catalog.controller';

export const catalogRoutes: Router = Router();

// PÚBLICA — qué programas hay y si hay inscripciones abiertas es información
// que cualquiera puede consultar antes de crearse una cuenta.
catalogRoutes.get('/catalog', catalogController.getCatalog); // pública
