const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'visits.json');

// Init data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

app.use(express.static(path.join(__dirname, 'public')));

// Track visit
app.get('/track', (req, res) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'Desconhecido';

  const userAgent = req.headers['user-agent'] || 'Desconhecido';
  const referer = req.headers['referer'] || 'Direto';
  const timestamp = new Date().toISOString();

  const visit = { ip, userAgent, referer, timestamp };

  const visits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  visits.push(visit);
  fs.writeFileSync(DATA_FILE, JSON.stringify(visits, null, 2));

  console.log(`[${timestamp}] Novo acesso — IP: ${ip}`);

  // Redirect to main page after tracking
  res.redirect('/');
});

// Admin API — list all visits
app.get('/admin/visits', (req, res) => {
  const visits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(visits);
});

// Clear visits
app.delete('/admin/visits', (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Painel admin: http://localhost:${PORT}/admin.html`);
  console.log(`🔗 Link de rastreio: http://localhost:${PORT}/track\n`);
});
