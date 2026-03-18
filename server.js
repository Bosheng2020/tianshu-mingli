/**
 * 天枢命理 — 本地服务器
 * Node.js + Express + SQLite
 * 邮箱验证码登录，无需外部服务
 */
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
function uuidv4() { return crypto.randomUUID(); }

const app = express();
const PORT = process.env.PORT || 3888;

// ===== Database Setup =====
const db = new Database(path.join(__dirname, 'tianshu.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS verify_codes (
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT DEFAULT 'register',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  );
`);

// ===== Middleware =====
app.use(express.json());
// Static files — exclude /api/ routes so they hit Express handlers first
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  express.static(__dirname)(req, res, next);
});

// ===== Analytics: 访问统计 + 生辰记录 =====
const fs = require('fs');
const LOG_FILE = path.join(__dirname, 'analytics.jsonl');
const stats = { totalVisits: 0, totalPaipan: 0, features: {}, startTime: new Date().toISOString() };

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown';
}

function logEvent(type, data, req) {
  const entry = {
    time: new Date().toISOString(),
    type: type,
    ip: getClientIP(req),
    ua: (req.headers['user-agent'] || '').substring(0, 150),
    ...data
  };
  try { fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n'); } catch(e) {}
  return entry;
}

// Track page visits
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
    stats.totalVisits++;
    logEvent('visit', {}, req);
  }
  next();
});

// API: Record paipan (排盘记录)
app.post('/api/record', (req, res) => {
  const { year, month, day, hour, minute, city, province, gender, feature } = req.body || {};
  stats.totalPaipan++;
  stats.features[feature || 'bazi'] = (stats.features[feature || 'bazi'] || 0) + 1;
  logEvent('paipan', { year, month, day, hour, minute, city, province, gender, feature }, req);
  res.json({ ok: true });
});

// API: Get stats (简单密码保护)
app.get('/api/stats', (req, res) => {
  if (req.query.key !== 'tianshu2026') return res.status(403).json({ error: '无权访问' });

  // Read recent logs
  let recentLogs = [];
  try {
    const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').slice(-100);
    recentLogs = lines.map(l => { try { return JSON.parse(l); } catch(e) { return null; } }).filter(Boolean);
  } catch(e) {}

  res.json({
    stats: stats,
    uptime: process.uptime(),
    recentPaipan: recentLogs.filter(l => l.type === 'paipan').slice(-50),
    recentVisits: recentLogs.filter(l => l.type === 'visit').length,
    totalLogs: recentLogs.length
  });
});

// ===== Helper: Generate 6-digit code =====
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ===== Helper: Auth middleware =====
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '请先登录' });

  const session = db.prepare(`SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')`).get(token);
  if (!session) return res.status(401).json({ error: '登录已过期，请重新登录' });

  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(session.user_id);
  if (!user) return res.status(401).json({ error: '用户不存在' });

  req.user = user;
  next();
}

// ===== API: Send Verification Code =====
app.post('/api/send-code', (req, res) => {
  const { email, type } = req.body; // type: 'register' | 'login' | 'reset'
  if (!email || !email.includes('@')) return res.status(400).json({ error: '请输入有效的邮箱地址' });

  // Check if user exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (type === 'register' && existing) return res.status(400).json({ error: '该邮箱已注册，请直接登录' });
  if (type === 'login' && !existing) return res.status(400).json({ error: '该邮箱未注册，请先注册' });

  // Rate limit: max 1 code per minute
  const recent = db.prepare("SELECT * FROM verify_codes WHERE email = ? AND created_at > datetime('now', '-1 minute')").get(email);
  if (recent) return res.status(429).json({ error: '发送太频繁，请1分钟后再试' });

  // Generate and store code
  const code = genCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
  db.prepare('DELETE FROM verify_codes WHERE email = ?').run(email);
  db.prepare('INSERT INTO verify_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)').run(email, code, type || 'register', expiresAt);

  // In development: print code to console (no real email needed)
  console.log(`\n📧 验证码发送到 ${email}: 【${code}】 (10分钟内有效)\n`);

  res.json({ success: true, message: '验证码已发送，请查看邮箱（开发模式：请看控制台）' });
});

// ===== API: Register =====
app.post('/api/register', (req, res) => {
  const { email, code, password, name } = req.body;
  if (!email || !code) return res.status(400).json({ error: '邮箱和验证码不能为空' });

  // Verify code
  const stored = db.prepare(`SELECT * FROM verify_codes WHERE email = ? AND code = ? AND type = 'register' AND expires_at > datetime('now')`).get(email, code);
  if (!stored) return res.status(400).json({ error: '验证码无效或已过期' });

  // Check duplicate
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: '该邮箱已注册' });

  // Create user
  const userId = uuidv4();
  const hashedPw = password ? bcrypt.hashSync(password, 10) : null;
  db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)').run(userId, email, hashedPw, name || email.split('@')[0]);

  // Clean up code
  db.prepare('DELETE FROM verify_codes WHERE email = ?').run(email);

  // Create session
  const token = uuidv4();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires);

  console.log(`✅ 新用户注册: ${email}`);
  res.json({ success: true, token, user: { id: userId, email, name: name || email.split('@')[0] } });
});

// ===== API: Login with code =====
app.post('/api/login-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: '邮箱和验证码不能为空' });

  const stored = db.prepare(`SELECT * FROM verify_codes WHERE email = ? AND code = ? AND type = 'login' AND expires_at > datetime('now')`).get(email, code);
  if (!stored) return res.status(400).json({ error: '验证码无效或已过期' });

  const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: '用户不存在' });

  // Clean up
  db.prepare('DELETE FROM verify_codes WHERE email = ?').run(email);
  db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);

  // Create session
  const token = uuidv4();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expires);

  console.log(`🔑 用户登录: ${email}`);
  res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

// ===== API: Login with password =====
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: '邮箱或密码错误' });
  if (!user.password) return res.status(400).json({ error: '该账号未设置密码，请使用验证码登录' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: '邮箱或密码错误' });

  db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);

  const token = uuidv4();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expires);

  res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

// ===== API: Get current user =====
app.get('/api/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// ===== API: Logout =====
app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ success: true });
});

// ===== Health check =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), uptime: process.uptime() });
});

// ===== Fallback: serve index.html =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`天枢命理启动成功 → http://localhost:${PORT}`);

  // Keep alive: self-ping every 14 minutes (prevents Render free tier sleep)
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || '';
  if (RENDER_URL) {
    const https = require('https');
    const http = require('http');
    setInterval(() => {
      const url = RENDER_URL + '/api/health';
      (url.startsWith('https') ? https : http).get(url, () => {}).on('error', () => {});
    }, 14 * 60 * 1000);
    console.log(`[KeepAlive] 每14分钟自动ping ${RENDER_URL}`);
  }
});
