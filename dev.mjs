// Local dev server: serves this static site and forwards /mcp/* to the MCP
// landing page's Vite dev server (altship-mcp/apps/site), mirroring the /mcp
// rewrite in vercel.json.
//
//   node dev.mjs                      -> http://localhost:8000
//   PORT=3000 MCP_DEV_URL=http://localhost:5175 node dev.mjs
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT) || 8000;
const MCP = new URL(process.env.MCP_DEV_URL || 'http://localhost:5174');
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

function proxy(req, res) {
  const upstream = http.request(
    { hostname: MCP.hostname, port: MCP.port, path: req.url, method: req.method, headers: req.headers },
    (up) => {
      res.writeHead(up.statusCode, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`MCP dev server not reachable at ${MCP.origin}.\nStart it with: cd ~/code/altship-mcp/apps/site && npm run dev`);
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) return notFound(res);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return notFound(res);
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];
  if (pathname === '/mcp') {
    res.writeHead(308, { Location: '/mcp/' + req.url.slice(4) });
    return res.end();
  }
  if (pathname.startsWith('/mcp/')) return proxy(req, res);
  serveStatic(req, res);
});

// Vite's hot-reload websocket lives under /mcp/ too; pipe the raw upgrade through.
server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/mcp/')) return socket.destroy();
  const upstream = net.connect(MCP.port, MCP.hostname, () => {
    upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`);
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      upstream.write(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`);
    }
    upstream.write('\r\n');
    upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
});

server.listen(PORT, () => {
  console.log(`altship site: http://localhost:${PORT}`);
  console.log(`/mcp/*      -> ${MCP.origin}`);
});
