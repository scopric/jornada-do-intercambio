/* ===== JORNADA — admin/admin-auth.js ===== */

const ADMIN_PWD = "jornada@admin2025";

// ── Firebase init ─────────────────────────────────────────────
let _db = null;

async function initFirebase() {
    if (_db) return _db;
    try {
        const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const cfg = {
            apiKey: "AIzaSyAuSaL0-SCYBbcha4Mhu-9bY_2adIfdudM",
            authDomain: "jornada-intercambio.firebaseapp.com",
            projectId: "jornada-intercambio",
            storageBucket: "jornada-intercambio.firebasestorage.app",
            messagingSenderId: "295607221175",
            appId: "1:295607221175:web:a7742d1ebeb9ca97120632"
        };
        const apps = getApps();
        const app = apps.length ? apps[0] : initializeApp(cfg);
        _db = getFirestore(app);
        window._db = _db;
        return _db;
    } catch (e) {
        console.warn('[Admin] Firebase não disponível:', e.message);
        return null;
    }
}

// ── Auth ──────────────────────────────────────────────────────
function isLoggedIn() {
    return sessionStorage.getItem('jdi_admin') === '1';
}

function requireAdmin() {
    if (!isLoggedIn()) {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    } else {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        initFirebase().then(db => { if (db && typeof onReady === 'function') onReady(db); });
    }
}

window.adminLogin = function () {
    const val = document.getElementById('adminPwd').value;
    const err = document.getElementById('loginErr');
    if (val === ADMIN_PWD) {
        sessionStorage.setItem('jdi_admin', '1');
        requireAdmin();
    } else {
        err.style.display = 'block';
        setTimeout(() => { err.style.display = 'none'; }, 3000);
    }
};

window.adminLogout = function () {
    sessionStorage.removeItem('jdi_admin');
    window.location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    const pwd = document.getElementById('adminPwd');
    if (pwd) pwd.addEventListener('keydown', e => { if (e.key === 'Enter') window.adminLogin(); });
    requireAdmin();
});

// ── Highlight sidebar link ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    document.querySelectorAll('.sb-link').forEach(a => {
        if (path.endsWith(a.getAttribute('href') || '')) a.classList.add('active');
    });
});

// ── Utilidades ────────────────────────────────────────────────
window.showToast = function (msg, duration = 3000) {
    let t = document.getElementById('globalToast');
    if (!t) { t = document.createElement('div'); t.id = 'globalToast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
};

window.escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
window.fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
window.fmtDatetime = d => d ? new Date(d).toLocaleString('pt-BR') : '—';
window.relTime = d => {
    if (!d) return '—';
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return 'agora';
    if (s < 3600) return `${Math.floor(s / 60)}min atrás`;
    if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
    return `${Math.floor(s / 86400)}d atrás`;
};

// ── Sidebar ───────────────────────────────────────────────────
const SIDEBAR_HTML = `
<div class="sidebar">
  <div class="sb-logo">
    <div class="logo-text">Jornada <span>Admin</span></div>
    <div class="logo-sub">Painel de Controle</div>
  </div>
  <nav class="sb-nav">
    <div class="sb-section">Principal</div>
    <a href="index.html" class="sb-link"><span class="icon">📊</span> Dashboard</a>
    <a href="users.html" class="sb-link"><span class="icon">👥</span> Usuários</a>
    <div class="sb-section">Analytics</div>
    <a href="analytics.html" class="sb-link"><span class="icon">📈</span> Conteúdo</a>
    <a href="feedback.html" class="sb-link"><span class="icon">💬</span> Feedbacks</a>
    <div class="sb-section">Site</div>
    <a href="../index.html" class="sb-link" target="_blank"><span class="icon">🌐</span> Ver site</a>
  </nav>
  <div class="sb-bottom">
    <div class="sb-user" id="sbTime"></div>
    <button class="btn-logout" onclick="adminLogout()">↩ Sair</button>
  </div>
</div>`;

document.addEventListener('DOMContentLoaded', () => {
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) { sidebarEl.innerHTML = SIDEBAR_HTML.trim().replace(/^<div[^>]+>/, '').replace(/<\/div>$/, ''); sidebarEl.outerHTML = SIDEBAR_HTML; }
    setInterval(() => {
        const el = document.getElementById('sbTime');
        if (el) el.textContent = new Date().toLocaleString('pt-BR');
    }, 30000);
    const el = document.getElementById('sbTime');
    if (el) el.textContent = new Date().toLocaleString('pt-BR');
});
