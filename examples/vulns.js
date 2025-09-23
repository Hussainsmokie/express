// examples/vulns.js
// Intentionally vulnerable examples for SonarQube testing.
// Do NOT use this code in production.

import http from 'http';
import url from 'url';
import { exec } from 'child_process';
import crypto from 'crypto';

const server = http.createServer((req, res) => {
  const q = url.parse(req.url, true).query;
  const path = url.parse(req.url).pathname;

  // 1) Hard-coded credentials (secret in source)
  const API_KEY = "supersecretapikey_123456"; // << hard-coded secret (Sonar rule: hard-coded credentials)

  if (path === '/secret') {
    // returning the credential directly so Sonar flags it and so can be seen easily
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(`API_KEY=${API_KEY}`);
    return;
  }

  // 2) eval on user input (dangerous)
  // e.g. GET /eval?code=2+3
  if (path === '/eval') {
    const userCode = q.code || '1+1';
    // eslint-disable-next-line no-eval
    const result = eval(userCode); // << dynamic code execution
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(`eval result: ${String(result)}`);
    return;
  }

  // 3) Command injection via child_process.exec
  // e.g. GET /ping?host=localhost
  if (path === '/ping') {
    const host = q.host || 'localhost';
    // Danger: building a shell command from user input
    exec(`ping -c 1 ${host}`, (err, stdout, stderr) => { // << potential command injection
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        return res.end('error');
      }
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(stdout || stderr);
    });
    return;
  }

  // 4) Reflected XSS: echoing unsanitized user input into HTML
  // e.g. GET /xss?msg=<script>alert(1)</script>
  if (path === '/xss') {
    const msg = q.msg || 'hello';
    // Intentionally sending raw HTML with user data
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<html><body>Message: ${msg}</body></html>`); // << reflected XSS
    return;
  }

  // 5) Weak hashing (MD5) usage
  if (path === '/hash') {
    const input = q.input || 'data';
    const md5 = crypto.createHash('md5').update(input).digest('hex'); // << weak hash
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(md5);
    return;
  }

  // 6) Insecure randomness for tokens
  if (path === '/token') {
    // Insecure — Math.random used for tokens
    const token = Math.random().toString(36).slice(2);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(token); // << insecure random (predictable)
    return;
  }

  // 7) SQL injection pattern (string concatenation)
  // This is a pattern example; it doesn't execute DB calls here, but Sonar will flag concatenation pattern.
  if (path === '/sql') {
    const user = q.user || 'guest';
    const sql = "SELECT * FROM users WHERE username = '" + user + "';"; // << SQL concatenation
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(sql);
    return;
  }

  // default
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('vulnerabilities example server running. Try /eval /ping /xss /hash /token /sql /secret');
});

server.listen(4000, () => {
  // intentionally logging a secret to demonstrate detection of sensitive logging (if that rule is enabled)
  console.log('Vuln demo server listening on http://localhost:4000');
});
