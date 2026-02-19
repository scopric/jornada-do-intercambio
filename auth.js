/* ===== JORNADA — auth.js ===== */
/* Autenticação localStorage (MVP — sem backend) */

const JAuth = (() => {

    const USERS_KEY = 'jdi_users';
    const SESSION_KEY = 'jdi_session';
    const TRIAL_DAYS = 3;

    // ── Global Seed Users (Hardcoded for Access Anywhere) ──
    const SEED_USERS = {
        'ct.felippe@gmail.com': {
            id: 'seed-admin-001',
            name: 'Felippe Cardoso',
            email: 'ct.felippe@gmail.com',
            phone: '+55 11 99999-9999',
            passwordHash: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', // 12345678
            plan: 'premium',
            trialStart: 1709251200000, // Fixed past date
            trialEnd: 4102444800000,   // Far future (2100)
            createdAt: 1709251200000,
            onboarding: {
                country: 'BR',
                interests: ['work', 'english', 'culture'],
                school: 'Seda College',
                arrivalDate: '2024-06-01',
                mainChallenge: 'housing',
                howFound: 'other',
                acceptsComms: true,
                phase: 'planning',
                visa: 'stamp2',
                housing: 'looking',
                notes: 'Admin Access',
                nickname: 'Felippe',
                birthdate: '1990-01-01',
                location: 'BR_capital'
            }
        }
    };

    // ── Utilitários ──────────────────────────────────────
    async function hashPassword(pwd) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function getUsers() {
        try {
            const localUsers = JSON.parse(localStorage.getItem(USERS_KEY)) || {};
            return { ...localUsers, ...SEED_USERS };
        }
        catch { return { ...SEED_USERS }; }
    }

    function saveUsers(users) {
        // Filter out seed users to avoid saving them to localStorage unnecessarily
        const toSave = {};
        for (const k in users) {
            if (!SEED_USERS[k]) toSave[k] = users[k];
        }
        localStorage.setItem(USERS_KEY, JSON.stringify(toSave));
    }

    function getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
        catch { return null; }
    }

    function saveSession(data) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    }

    // ── Registro ─────────────────────────────────────────
    async function register(data) {
        // data: { name, email, password, phone, country, interests, school,
        //         arrivalDate, mainChallenge, howFound, acceptsComms, plan }
        const { name, email, password, phone } = data;

        if (!name || !email || !password) return { ok: false, error: 'Preencha todos os campos obrigatórios.' };
        if (password.length < 8) return { ok: false, error: 'A senha deve ter pelo menos 8 caracteres.' };

        const users = getUsers();
        const key = email.toLowerCase().trim();

        if (users[key]) return { ok: false, error: 'Este e-mail já está cadastrado.' };

        const hash = await hashPassword(password);
        const now = Date.now();

        users[key] = {
            id: crypto.randomUUID ? crypto.randomUUID() : now.toString(),
            name: name.trim(),
            email: key,
            phone: phone || '',
            passwordHash: hash,
            plan: data.plan || 'trial',
            trialStart: now,
            trialEnd: now + (TRIAL_DAYS * 86400000),
            createdAt: now,
            onboarding: {
                country: data.country || '',
                interests: data.interests || [],
                school: data.school || '',
                arrivalDate: data.arrivalDate || '',
                mainChallenge: data.mainChallenge || '',
                howFound: data.howFound || '',
                acceptsComms: data.acceptsComms || false,
                // New fields for personalization
                phase: data.phase || '',
                visa: data.visa || '',
                housing: data.housing || '',
                notes: data.notes || '',
                nickname: data.nickname || '',
                birthdate: data.birthdate || '',
                location: data.location || ''
            }
        };

        saveUsers(users);
        _startSession(users[key]);
        // Persiste no Firestore (se firebase-config.js + db.js carregados)
        if (typeof JDB !== 'undefined') JDB.saveUser(users[key]).catch(() => { });
        return { ok: true, user: _safeUser(users[key]) };
    }

    // ── Login ────────────────────────────────────────────
    async function login(email, password) {
        const users = getUsers();
        const key = email.toLowerCase().trim();
        const user = users[key];

        if (!user) return { ok: false, error: 'E-mail não cadastrado.' };

        const hash = await hashPassword(password);
        if (hash !== user.passwordHash) return { ok: false, error: 'Senha incorreta.' };

        _startSession(user);
        // Atualiza no Firestore
        if (typeof JDB !== 'undefined') JDB.saveUser(user).catch(() => { });
        return { ok: true, user: _safeUser(user) };
    }

    // ── Sessão ───────────────────────────────────────────
    function _startSession(user) {
        saveSession({
            email: user.email,
            name: user.name,
            plan: user.plan,
            trialEnd: user.trialEnd,
            onboarding: user.onboarding, // Persist onboarding data for AI personalization
            loginAt: Date.now()
        });
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    }

    function getUser() {
        return getSession();
    }

    function isLoggedIn() {
        return !!getSession();
    }

    // ── Plano e Trial ────────────────────────────────────
    function hasAccess() {
        const s = getSession();
        if (!s) return false;
        if (s.plan === 'premium' || s.plan === 'plus') return true;
        if (s.plan === 'trial') return Date.now() < s.trialEnd;
        return false;
    }

    function getTrialDaysLeft() {
        const s = getSession();
        if (!s || s.plan !== 'trial') return 0;
        const ms = s.trialEnd - Date.now();
        return ms > 0 ? Math.ceil(ms / 86400000) : 0;
    }

    function getPlanLabel() {
        const s = getSession();
        if (!s) return '';
        if (s.plan === 'premium') return 'Premium';
        if (s.plan === 'plus') return 'Premium Plus';
        if (s.plan === 'trial') {
            const left = getTrialDaysLeft();
            return left > 0 ? `Trial — ${left} dia${left !== 1 ? 's' : ''} restante${left !== 1 ? 's' : ''}` : 'Trial expirado';
        }
        return '';
    }

    // ── Guard ────────────────────────────────────────────
    // Chame no topo de páginas protegidas
    function requireAuth(redirectTo = 'login.html') {
        if (!isLoggedIn() || !hasAccess()) {
            window.location.href = redirectTo;
        }
    }

    // Remove dados sensíveis antes de expor
    function _safeUser(u) {
        const { passwordHash, ...safe } = u;
        return safe;
    }

    return {
        register, login, logout,
        getUser, getCurrentUser: getUser,
        isLoggedIn, hasAccess,
        trialDaysLeft: getTrialDaysLeft,
        getTrialDaysLeft,
        getPlanLabel,
        getPlanLabel,
        requireAuth,
        getAllUsers: getUsers // Expose all users for admin dashboard
    };
})();

