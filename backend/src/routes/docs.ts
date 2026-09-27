import { Router } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { openApiSpec } from '../docs/openapi.js';

export const docsRouter = Router();

// 1. Raw OpenAPI 3.1 JSON Specification
docsRouter.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
});

// 2. Scalar UI Documentation Reference
docsRouter.use(
  '/',
  apiReference({
    spec: {
      content: openApiSpec,
    },
    theme: 'saturn',
    pageTitle: 'OpenVyapar API Reference',
    darkMode: true,
    hideTestRequestButton: true,
    isEditable: false,
    customCss: `
      .scalar-dev-tools,
      [data-testid="devtools"],
      .scalar-developer-tools,
      .scalar-client-toggle,
      .scalar-version {
        display: none !important;
      }
    `,
    metaData: {
      title: 'OpenVyapar API Reference',
      description: 'Unified Business Identity Digital Public Infrastructure (DPI) API Documentation',
    },
  })
);
