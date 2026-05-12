import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { openApiDocument } from './openapi.js';

export function configurarSwagger(app: Express): void {
  app.get('/docs.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: 'PillGator API - Documentacao',
      swaggerOptions: {
        docExpansion: 'list',
        persistAuthorization: true,
        displayRequestDuration: true
      }
    })
  );
}
