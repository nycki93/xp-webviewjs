import { Application } from '@webviewjs/webview';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

function startServer() {
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
  const api = `http://localhost:${port}`;
  const app = new Application();
  const window = app.createBrowserWindow();
  const webview = window.createWebview({
    html: `
      <!DOCTYPE html>
      <html>
        <head><title>My Webview</title></head>
        <body>

        <h1 id="output">Hello World</h1>
        <button id="submit">Submit</button>
        <p id="api-ver"></p>
        
        <script>
        
        const submit = document.getElementById('submit');
        submit.onclick = function() {
          window.ipc.postMessage('Hellow from webview');
        };

        const apiVer = document.getElementById('api-ver');
        fetch("${api}").then((data) => {
          return data.json();
        }).then((json) => {
          apiVer.innerHTML = 'api version: ' + json['api'];
        });
        </script>
        </body>
      </html>
    `,
    preload: `window.onIpcMessage = function(data) {
      const output = document.getElementById('output');
      output.innerText = 'message from server: ' + data;
    }`,
  });

  webview.onIpcMessage((data) => {
    const reply = `you said ${data.body.toString('utf-8')}`;
    webview.evaluateScript(`onIpcMessage("${reply}")`);
  });

  if (!webview.isDevtoolsOpen()) {
    webview.openDevtools();
  }

  return app;
}

async function main() {
  if (process.platform === 'win32') {
    process.env.WEBVIEW2_USER_DATA_FOLDER = process.env.WEBVIEW2_USER_DATA_FOLDER || process.cwd();
  }
  const port = await startServer();
  const app = startApp(port);

  // The app blocks the main thread, so any external services have to be run in worker threads.
  app.run();
}

main();
