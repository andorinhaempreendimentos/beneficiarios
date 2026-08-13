const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const JSON_PATH = path.join(__dirname, 'checklist_testes.json');
const HTML_PATH = path.join(__dirname, 'checklist_testes.html');

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /api/testes -> Ler JSON do disco
  if (req.method === 'GET' && req.url === '/api/testes') {
    fs.readFile(JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao ler checklist_testes.json' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // POST /api/testes -> Gravar JSON no disco
  if (req.method === 'POST' && req.url === '/api/testes') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFile(JSON_PATH, JSON.stringify(parsed, null, 2), 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro ao gravar no arquivo' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Banco checklist_testes.json atualizado!' }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON invalido' }));
      }
    });
    return;
  }

  // Servir HTML principal
  if (req.method === 'GET' && (req.url === '/' || req.url === '/checklist_testes.html')) {
    fs.readFile(HTML_PATH, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erro ao carregar HTML');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Outros arquivos estáticos
  const filePath = path.join(__dirname, req.url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = ext === '.json' ? 'application/json' : 'text/plain';
    res.writeHead(200, { 'Content-Type': `${contentType}; charset=utf-8` });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`\n🚀 Servidor de Banco de Dados JSON rodando em: http://localhost:${PORT}`);
  console.log(`📁 Arquivo de dados em disco: ${JSON_PATH}\n`);
});
