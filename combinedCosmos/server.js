const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 4000;

const server = http.createServer((req, res) => {
  let filePath;

  switch (req.url) {
    case '/':
      filePath = path.join(__dirname, 'main.html');
      break;
    case '/1':
      filePath = path.join(__dirname, 'boxplot/boxplot.html');
      break;
    case '/2':
      filePath = path.join(__dirname, 'scatterplot/scatterplot.html');
      break;
    case '/3':
      filePath = path.join(__dirname, '3d/3d.html');
      break;
    default:
      filePath = path.join(__dirname, req.url);
  }

  let extname = String(path.extname(filePath)).toLowerCase();

  let mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  let contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, 'utf-8', (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
