import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

const GOOGLE_VERIFICATION_PATH = '/google0f34af79244b526c.html';
const GOOGLE_VERIFICATION_CONTENT = 'google-site-verification: google0f34af79244b526c.html';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');
  const googleVerificationFile = join(browserDistFolder, 'google0f34af79244b526c.html');

  const commonEngine = new CommonEngine();

  server.use((req, res, next) => {
    const path = req.originalUrl.split('?')[0];
    if (path !== GOOGLE_VERIFICATION_PATH) {
      next();
      return;
    }

    if (existsSync(googleVerificationFile)) {
      res.sendFile(googleVerificationFile);
      return;
    }

    res.type('text/html; charset=utf-8');
    res.send(GOOGLE_VERIFICATION_CONTENT);
  });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
