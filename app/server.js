import { createServer } from 'node:http';
import { parentPort } from 'node:worker_threads';

const server = createServer((req, res) => {
  parentPort.postMessage({ log: `GET ${req.url}`});
  res.writeHead(200, { 
    'content-type': 'text/json',
    'access-control-allow-origin': '*',
  });
  res.write(`{"api":"v0.1.0"}`);
  res.end();
});

server.listen(0, () => {
  const port = server.address().port;
  parentPort.postMessage({ port });
  console.log('server started');
});
