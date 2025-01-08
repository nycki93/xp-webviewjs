import { Application } from '@webviewjs/webview';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

async function startServer() {
  let resolve;
  const promise = new Promise(r => resolve = r);
  const worker = new Worker(join(import.meta.dirname, 'server.js'), {
    stdout: true,
    stderr: true,
  });
  worker.on('message', (message) => {
    if (message.port) {
      resolve(message.port);
    }
  });
  return promise;
}

function startApp(port) {
  const app = new Application();
  const window = app.createBrowserWindow();
  const webview = window.createWebview({ url: `http://localhost:${port}` });
  return app;
}

async function main() {
  if (process.platform === 'win32') {
    process.env.WEBVIEW2_USER_DATA_FOLDER = process.env.WEBVIEW2_USER_DATA_FOLDER || process.cwd();
  }
  const port = await startServer();
  const app = startApp(port);

  // The app blocks the main thread so any external services have to be run in worker threads.
  app.run();
}

main();
