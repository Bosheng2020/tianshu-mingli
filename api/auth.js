/**
 * 天枢命理 — Vercel Serverless Auth API
 * 内存存储（Vercel 免费版无持久磁盘）
 * 路由：/api/auth?action=send-code|register|login|login-code|me|logout
 */

// In-memory store (resets on cold start, fine for demo)
const users = new Map();     // email -> { id, email, password, name, created }
const sessions = new Map();  // token -> { userId, expires }
const codes = new Map();     // email -> { code, type, expires, sentAt }

function genId() {
  return 'u_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
}
function genToken() {
  return 't_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
}
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function hashPw(pw) {
  // Simple hash for demo (NOT for production — use bcrypt in real deployment)
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) - h + pw.charCodeAt(i)) | 0; }
  return 'h_' + Math.abs(h).toString(36) + '_' + pw.length;
}
function checkPw(pw, hash) {
  return hashPw(pw) === hash;
}

function getUser(token) {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s || s.expires < Date.now()) { sessions.delete(token); return null; }
  for (const [email, u] of users) { if (u.id === s.userId) return { id: u.id, email, name: u.name }; }
  return null;
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || '';
  const body = req.body || {};
  const token = (req.headers.authorization || '').replace('Bearer ', '');

  try {
    // ===== SEND CODE =====
    if (action === 'send-code') {
      const { email, type } = body;
      if (!email || !email.includes('@')) return res.json({ error: '请输入有效的邮箱地址' });
      if (type === 'register' && users.has(email)) return res.json({ error: '该邮箱已注册，请直接登录' });
      if (type === 'login' && !users.has(email)) return res.json({ error: '该邮箱未注册，请先注册' });

      const prev = codes.get(email);
      if (prev && Date.now() - prev.sentAt < 60000) return res.json({ error: '发送太频繁，请1分钟后再试' });

      const code = genCode();
      codes.set(email, { code, type: type || 'register', expires: Date.now() + 600000, sentAt: Date.now() });
      console.log(`📧 验证码: ${email} → 【${code}】`);
      return res.json({ success: true, message: '验证码已发送（开发模式：' + code + '）', _devCode: code });
    }

    // ===== REGISTER =====
    if (action === 'register') {
      const { email, code, password, name } = body;
      if (!email || !code) return res.json({ error: '邮箱和验证码不能为空' });
      const stored = codes.get(email);
      if (!stored || stored.code !== code || stored.type !== 'register' || stored.expires < Date.now())
        return res.json({ error: '验证码无效或已过期' });
      if (users.has(email)) return res.json({ error: '该邮箱已注册' });

      const id = genId();
      users.set(email, { id, email, password: password ? hashPw(password) : null, name: name || email.split('@')[0], created: Date.now() });
      codes.delete(email);
      const tk = genToken();
      sessions.set(tk, { userId: id, expires: Date.now() + 7 * 86400000 });
      return res.json({ success: true, token: tk, user: { id, email, name: name || email.split('@')[0] } });
    }

    // ===== LOGIN WITH CODE =====
    if (action === 'login-code') {
      const { email, code } = body;
      if (!email || !code) return res.json({ error: '邮箱和验证码不能为空' });
      const stored = codes.get(email);
      if (!stored || stored.code !== code || stored.type !== 'login' || stored.expires < Date.now())
        return res.json({ error: '验证码无效或已过期' });
      const u = users.get(email);
      if (!u) return res.json({ error: '用户不存在' });
      codes.delete(email);
      const tk = genToken();
      sessions.set(tk, { userId: u.id, expires: Date.now() + 7 * 86400000 });
      return res.json({ success: true, token: tk, user: { id: u.id, email, name: u.name } });
    }

    // ===== LOGIN WITH PASSWORD =====
    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) return res.json({ error: '邮箱和密码不能为空' });
      const u = users.get(email);
      if (!u) return res.json({ error: '邮箱或密码错误' });
      if (!u.password) return res.json({ error: '该账号未设置密码，请使用验证码登录' });
      if (!checkPw(password, u.password)) return res.json({ error: '邮箱或密码错误' });
      const tk = genToken();
      sessions.set(tk, { userId: u.id, expires: Date.now() + 7 * 86400000 });
      return res.json({ success: true, token: tk, user: { id: u.id, email, name: u.name } });
    }

    // ===== ME =====
    if (action === 'me') {
      const user = getUser(token);
      if (!user) return res.status(401).json({ error: '未登录' });
      return res.json({ user });
    }

    // ===== LOGOUT =====
    if (action === 'logout') {
      if (token) sessions.delete(token);
      return res.json({ success: true });
    }

    return res.json({ error: '未知操作: ' + action });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
