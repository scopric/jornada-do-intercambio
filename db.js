/* ===== JORNADA — db.js ===== */
/* Wrapper do Firestore — salva dados na nuvem */

const JDB = (() => {

    // ── Detecta se Firebase foi configurado ──────────────────────
    function isConfigured() {
        try {
            return window._firestoreDB !== undefined;
        } catch { return false; }
    }

    // ── Inicialização assíncrona do Firestore ────────────────────
    let _db = null;
    let _ready = false;

    async function init() {
        if (_ready) return _db;
        try {
            const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
            const { getFirestore, collection, addDoc, setDoc, getDocs, doc, serverTimestamp, query, orderBy, limit }
                = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

            // Verifica se já foi inicializado pelo firebase-config.js
            const apps = getApps();
            if (!apps.length) {
                console.warn('[JDB] Firebase não inicializado — verifique firebase-config.js');
                return null;
            }
            _db = getFirestore(apps[0]);
            window._firestoreDB = _db;
            _ready = true;

            // Exporta funções do Firestore para uso interno
            window._fsOps = { collection, addDoc, setDoc, getDocs, doc, serverTimestamp, query, orderBy, limit };
            return _db;
        } catch (e) {
            console.warn('[JDB] Erro ao conectar ao Firestore:', e.message);
            return null;
        }
    }

    // ── USERS — salva ou atualiza cadastro ───────────────────────
    async function saveUser(userData) {
        const db = await init();
        if (!db) { console.warn('[JDB] Sem conexão — dados salvos só no localStorage'); return false; }
        const { setDoc, doc, serverTimestamp } = window._fsOps;
        try {
            const key = (userData.email || '').toLowerCase().replace(/[.#$[\]]/g, '_');
            await setDoc(doc(db, 'users', key), {
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                plan: userData.plan || 'trial',
                trialStart: userData.trialStart || Date.now(),
                trialEnd: userData.trialEnd || null,
                country: userData.onboarding?.country || '',
                location: userData.onboarding?.location || '',
                school: userData.onboarding?.school || '',
                interests: userData.onboarding?.interests || [],
                phase: userData.onboarding?.phase || '',
                visa: userData.onboarding?.visa || '',
                housing: userData.onboarding?.housing || '',
                mainChallenge: userData.onboarding?.mainChallenge || '',
                howFound: userData.onboarding?.howFound || '',
                acceptsComms: userData.onboarding?.acceptsComms || false,
                arrivalDate: userData.onboarding?.arrivalDate || '',
                nickname: userData.nickname || '',
                birthdate: userData.birthdate || '',
                notes: userData.onboarding?.notes || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, { merge: true });
            return true;
        } catch (e) {
            console.error('[JDB] Erro ao salvar usuário:', e); return false;
        }
    }

    // ── LEADS — salva lead do pre-form do chat ───────────────────
    async function saveLead(leadData) {
        const db = await init();
        if (!db) { return false; }
        const { addDoc, collection, serverTimestamp } = window._fsOps;
        try {
            await addDoc(collection(db, 'leads'), {
                name: leadData.name || '',
                email: leadData.email || '',
                phone: leadData.phone || '',
                source: leadData.source || 'ai-chat',
                page: window.location.pathname,
                userAgent: navigator.userAgent.substring(0, 120),
                createdAt: serverTimestamp(),
            });
            return true;
        } catch (e) {
            console.error('[JDB] Erro ao salvar lead:', e); return false;
        }
    }

    // ── ADMIN: busca todos os usuários ───────────────────────────
    async function getAllUsers() {
        const db = await init();
        if (!db) return [];
        const { getDocs, collection, query, orderBy } = window._fsOps;
        try {
            const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error('[JDB] Erro ao buscar usuários:', e); return [];
        }
    }

    // ── ADMIN: busca todos os leads ──────────────────────────────
    async function getAllLeads() {
        const db = await init();
        if (!db) return [];
        const { getDocs, collection, query, orderBy } = window._fsOps;
        try {
            const snap = await getDocs(query(collection(db, 'leads'), orderBy('createdAt', 'desc')));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error('[JDB] Erro ao buscar leads:', e); return [];
        }
    }

    // ── ADMIN: estatísticas rápidas ──────────────────────────────
    async function getStats() {
        const [users, leads] = await Promise.all([getAllUsers(), getAllLeads()]);
        const now = Date.now();
        return {
            totalUsers: users.length,
            trialUsers: users.filter(u => u.plan === 'trial' && (u.trialEnd?.seconds * 1000 || 0) > now).length,
            premiumUsers: users.filter(u => u.plan === 'premium' || u.plan === 'plus').length,
            totalLeads: leads.length,
            newToday: users.filter(u => {
                const ts = u.createdAt?.seconds * 1000;
                return ts && (now - ts) < 86400000;
            }).length,
        };
    }

    // ── FEEDBACK — salva feedback do usuário ─────────────────────
    async function saveFeedback(data) {
        const db = await init();
        if (!db) return false;
        const { addDoc, collection, serverTimestamp } = window._fsOps;
        try {
            await addDoc(collection(db, 'feedback'), {
                name: data.name || '',
                email: data.email || '',
                rating: data.rating || 0,
                category: data.category || 'geral',
                message: data.message || '',
                page: window.location.pathname,
                createdAt: serverTimestamp(),
            });
            return true;
        } catch (e) { console.error('[JDB] saveFeedback:', e); return false; }
    }

    // ── ANALYTICS — rastreia eventos de conteúdo ─────────────────
    async function trackEvent(type, label, extra = {}) {
        const db = await init();
        if (!db) return;
        const { addDoc, collection, serverTimestamp } = window._fsOps;
        try {
            await addDoc(collection(db, 'events'), {
                type, label,
                page: window.location.pathname,
                userEmail: window?._currentUser?.email || '',
                ...extra,
                createdAt: serverTimestamp(),
            });
        } catch (e) { /* silencioso */ }
    }

    // ── ADMIN: actualiza dados de um usuário ─────────────────────
    async function updateUser(email, updates) {
        const db = await init();
        if (!db) return false;
        const { doc, updateDoc, serverTimestamp } = window._fsOps;
        try {
            const key = email.toLowerCase().replace(/[.#$[\]]/g, '_');
            await updateDoc(doc(db, 'users', key), { ...updates, updatedAt: serverTimestamp() });
            return true;
        } catch (e) { console.error('[JDB] updateUser:', e); return false; }
    }

    // ── ADMIN: estende trial ──────────────────────────────────────
    async function extendTrial(email, days) {
        const db = await init();
        if (!db) return false;
        const { doc, updateDoc, serverTimestamp } = window._fsOps;
        try {
            const key = email.toLowerCase().replace(/[.#$[\]]/g, '_');
            const newEnd = new Date(Date.now() + days * 86400000);
            await updateDoc(doc(db, 'users', key), { trialEnd: newEnd, plan: 'trial', updatedAt: serverTimestamp() });
            return true;
        } catch (e) { console.error('[JDB] extendTrial:', e); return false; }
    }

    // ── ADMIN: cancela / reativa usuário ─────────────────────────
    async function cancelUser(email) { return updateUser(email, { plan: 'cancelled' }); }
    async function reactivateUser(email) { return updateUser(email, { plan: 'trial' }); }

    return {
        init, saveUser, saveLead, getAllUsers, getAllLeads, getStats,
        saveFeedback, trackEvent, updateUser, extendTrial, cancelUser, reactivateUser
    };
})();
