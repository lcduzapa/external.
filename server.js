const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'visits.json');

// Converte ::ffff:127.0.0.1 ou ::1 para formato IPv4 legível
function formatIP(ip) {
  if (!ip) return 'Desconhecido';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

// Init data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

app.use(express.static(path.join(__dirname, 'public')));

// Track visit
app.get('/track', (req, res) => {
  const rawIP =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'Desconhecido';

  const ip = formatIP(rawIP);
  const userAgent = req.headers['user-agent'] || 'Desconhecido';
  const referer = req.headers['referer'] || 'Direto';
  const timestamp = new Date().toISOString();

  const visit = { ip, userAgent, referer, timestamp };

  const visits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  visits.push(visit);
  fs.writeFileSync(DATA_FILE, JSON.stringify(visits, null, 2));

  console.log(`[${timestamp}] Novo acesso — IP: ${ip}`);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`📊 Painel admin: /admin.html`);
  console.log(`🔗 Link de rastreio: /track\n`);
});
