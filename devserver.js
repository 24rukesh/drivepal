// Drivepal web dev server: static files from www/ + CORS-safe proxy at /scapi/* -> Suzuki API.
const http = require('http');
const fs = require('fs');
const path = require('path');

const WWW = path.join(__dirname, 'www');
const API = 'https://tsp-in.suzukiconnect.info';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (urlPath.startsWith('/scapi/')) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      const payload = Buffer.concat(chunks);
      const headers = { 'Content-Type': 'application/json' };
      if (req.headers.authorization) headers.Authorization = req.headers.authorization;
      try {
        const upstream = await fetch(API + urlPath.slice('/scapi'.length), {
          method: req.method,
          headers,
          body: req.method === 'GET' ? undefined : (payload.toString() || '{}')
        });
        const text = await upstream.text();
        send(res, upstream.status, text);
      } catch (err) {
        send(res, 502, JSON.stringify({ errors: [{ code: 502, message: 'proxy: ' + err.message }] }));
      }
    });
    return;
  }

  const rel = urlPath === '/' ? '/index.html' : urlPath;
  const file = path.join(WWW, rel);
  if (!file.startsWith(WWW)) return send(res, 403, 'forbidden', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'not found', 'text/plain');
    send(res, 200, data, (TYPES[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8');
  });
});

server.listen(8773, () => console.log('Drivepal web on http://localhost:8773 (proxy /scapi -> ' + API + ')'));
