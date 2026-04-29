// Minimal local server to test serverless handler locally
const http = require('http');
const fs = require('fs');
const path = require('path');

const handlerPath = path.join(__dirname,'api','send.js');
const sendHandler = require(handlerPath);

const server = http.createServer((req,res)=>{
  const requestUrl = new URL(req.url, 'http://localhost');
  if (requestUrl.pathname === '/api/send') {
    // adapt to our module.exports signature
    return sendHandler(req,res);
  }
  // serve static files
  let filePath = path.join(__dirname, requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
  if (filePath.endsWith('/')) filePath += 'index.html';
  fs.readFile(filePath, (err,data)=>{
    if (err) { res.statusCode=404; res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const map = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
    res.setHeader('Content-Type', map[ext]||'text/plain'); res.end(data);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, ()=>console.log('Dev server listening at http://localhost:'+port));
