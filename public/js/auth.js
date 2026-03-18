/**
 * 天枢命理 — 用户登录系统
 */
(function() {
  'use strict';

  var AUTH_TOKEN_KEY = 'tianshu_token';
  var AUTH_USER_KEY = 'tianshu_user';

  function getToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(AUTH_TOKEN_KEY, t); }
  function getUser() { try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY)); } catch(e) { return null; } }
  function setUser(u) { localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u)); }
  function clearAuth() { localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem(AUTH_USER_KEY); }

  // API helper
  function api(method, url, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    var token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(r) { return r.json().then(function(data) { data._status = r.status; return data; }); });
  }

  // ===== UI =====
  function showAuthModal() {
    if (document.getElementById('auth-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.innerHTML = '<div class="auth-backdrop"></div><div class="auth-dialog">' +
      '<div class="auth-header"><h2>天枢命理</h2><p>登录后即可使用完整的命理分析功能</p></div>' +
      '<div class="auth-tabs"><button class="auth-tab active" data-mode="login">登录</button><button class="auth-tab" data-mode="register">注册</button></div>' +
      '<div class="auth-body">' +
        '<div class="auth-field"><label>邮箱地址</label><input type="email" id="auth-email" placeholder="your@email.com"></div>' +
        '<div class="auth-field" id="auth-name-field" style="display:none"><label>昵称</label><input type="text" id="auth-name" placeholder="输入你的昵称"></div>' +
        '<div class="auth-field"><label>密码</label><input type="password" id="auth-password" placeholder="输入密码（6位以上）"></div>' +
        '<div class="auth-field auth-code-row" id="auth-code-field" style="display:none"><div class="auth-code-input"><label>验证码</label><input type="text" id="auth-code" placeholder="6位验证码" maxlength="6"></div>' +
        '<button class="btn-send-code" id="btn-send-code">发送验证码</button></div>' +
        '<div class="auth-error" id="auth-error"></div>' +
        '<button class="btn btn-primary auth-submit" id="auth-submit">登录</button>' +
        '<p class="auth-switch">或使用 <a href="#" id="auth-toggle-code">验证码登录</a></p>' +
      '</div></div>';
    document.body.appendChild(modal);

    var mode = 'login'; // 'login' | 'register'
    var useCode = false;

    // Tab switching
    modal.querySelectorAll('.auth-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        mode = tab.dataset.mode;
        modal.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById('auth-name-field').style.display = mode === 'register' ? 'block' : 'none';
        document.getElementById('auth-code-field').style.display = (mode === 'register' || useCode) ? 'flex' : 'none';
        document.getElementById('auth-password').parentElement.style.display = (mode === 'register' || !useCode) ? 'block' : 'none';
        document.getElementById('auth-submit').textContent = mode === 'register' ? '注册' : '登录';
        document.getElementById('auth-error').textContent = '';
        if (mode === 'register') useCode = true;
      });
    });

    // Toggle code login
    document.getElementById('auth-toggle-code').addEventListener('click', function(e) {
      e.preventDefault();
      useCode = !useCode;
      document.getElementById('auth-code-field').style.display = useCode ? 'flex' : 'none';
      document.getElementById('auth-password').parentElement.style.display = useCode ? 'none' : 'block';
      this.textContent = useCode ? '密码登录' : '验证码登录';
    });

    // Send code
    document.getElementById('btn-send-code').addEventListener('click', function() {
      var email = document.getElementById('auth-email').value.trim();
      var btn = this;
      if (!email) { showError('请输入邮箱'); return; }
      btn.disabled = true; btn.textContent = '发送中...';
      api('POST', '/api/send-code', { email: email, type: mode }).then(function(data) {
        if (data.success) {
          showError('验证码已发送（开发模式：查看服务器控制台）', 'success');
          // Countdown
          var sec = 60;
          var timer = setInterval(function() {
            sec--;
            btn.textContent = sec + '秒后重发';
            if (sec <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = '发送验证码'; }
          }, 1000);
        } else {
          showError(data.error || '发送失败');
          btn.disabled = false; btn.textContent = '发送验证码';
        }
      }).catch(function() { showError('网络错误'); btn.disabled = false; btn.textContent = '发送验证码'; });
    });

    // Submit
    document.getElementById('auth-submit').addEventListener('click', function() {
      var email = document.getElementById('auth-email').value.trim();
      var password = document.getElementById('auth-password').value;
      var code = document.getElementById('auth-code').value.trim();
      var name = document.getElementById('auth-name').value.trim();

      if (!email) { showError('请输入邮箱'); return; }

      var btn = this;
      btn.disabled = true; btn.textContent = '处理中...';

      var promise;
      if (mode === 'register') {
        if (!code) { showError('请输入验证码'); btn.disabled = false; btn.textContent = '注册'; return; }
        promise = api('POST', '/api/register', { email: email, code: code, password: password, name: name });
      } else if (useCode) {
        if (!code) { showError('请输入验证码'); btn.disabled = false; btn.textContent = '登录'; return; }
        promise = api('POST', '/api/login-code', { email: email, code: code });
      } else {
        if (!password) { showError('请输入密码'); btn.disabled = false; btn.textContent = '登录'; return; }
        promise = api('POST', '/api/login', { email: email, password: password });
      }

      promise.then(function(data) {
        if (data.success) {
          setToken(data.token);
          setUser(data.user);
          modal.remove();
          updateAuthUI();
          showError('');
        } else {
          showError(data.error || '操作失败');
        }
        btn.disabled = false; btn.textContent = mode === 'register' ? '注册' : '登录';
      }).catch(function() {
        showError('网络错误，请确认服务器已启动');
        btn.disabled = false; btn.textContent = mode === 'register' ? '注册' : '登录';
      });
    });

    // Enter key
    ['auth-email','auth-password','auth-code'].forEach(function(id) {
      document.getElementById(id).addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('auth-submit').click();
      });
    });

    function showError(msg, type) {
      var el = document.getElementById('auth-error');
      el.textContent = msg;
      el.style.color = type === 'success' ? 'var(--jade,#2d8f6f)' : 'var(--vermillion,#c53d43)';
    }
  }

  // Update header to show user info
  function updateAuthUI() {
    var user = getUser();
    var existing = document.getElementById('auth-bar');
    if (existing) existing.remove();

    var bar = document.createElement('div');
    bar.id = 'auth-bar';

    if (user) {
      bar.innerHTML = '<div class="auth-bar-inner"><span class="auth-user-name">' + (user.name || user.email) + '</span><button class="btn-logout" id="btn-logout">退出</button></div>';
      bar.querySelector('#btn-logout').addEventListener('click', function() {
        api('POST', '/api/logout').catch(function(){});
        clearAuth();
        location.reload();
      });
      // Show main content
      document.querySelectorAll('.need-auth').forEach(function(el) { el.style.display = ''; });
    } else {
      bar.innerHTML = '<div class="auth-bar-inner"><button class="btn-login" id="btn-login">登录 / 注册</button></div>';
      bar.querySelector('#btn-login').addEventListener('click', showAuthModal);
    }

    var header = document.querySelector('header');
    if (header) header.after(bar);
  }

  // ===== Init =====
  function init() {
    var token = getToken();
    if (token) {
      // Verify token
      api('GET', '/api/me').then(function(data) {
        if (data.user) {
          setUser(data.user);
          updateAuthUI();
        } else {
          clearAuth();
          updateAuthUI();
          showAuthModal();
        }
      }).catch(function() {
        // Server not running, allow offline use
        updateAuthUI();
      });
    } else {
      updateAuthUI();
      showAuthModal();
    }
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
