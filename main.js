/* ===== NETFLIX DO INTERCÂMBIO — main.js ===== */

// ── ⚠️ SECURITY LAYER ────────────────────────────────────────
// Sanitiza input do usuário — previne XSS
function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    // Limitar tamanho
    str = str.slice(0, 500);
    // Escapar HTML
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
    return str.replace(/[&<>"'/]/g, ch => map[ch]);
}

// Rate limiting — max 10 msgs/min por sessão
const rateLimiter = (() => {
    const timestamps = [];
    const MAX = 10;
    const WINDOW = 60 * 1000; // 1 minuto
    return {
        allow() {
            const now = Date.now();
            // Remove timestamps antigos
            while (timestamps.length && timestamps[0] < now - WINDOW) timestamps.shift();
            if (timestamps.length >= MAX) return false;
            timestamps.push(now);
            return true;
        }
    };
})();

// Anti-spam: bloqueia mensagens repetidas consecutivas
let lastUserMsg = '';
function isSpam(text) {
    if (text === lastUserMsg) return true;
    lastUserMsg = text;
    return false;
}


// ── Navbar scroll ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Hamburger menu ─────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
});
// Close menu on link click
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
}));

// ── Rotating words in hero ─────────────────────────────────
const words = document.querySelectorAll('.rotating-wrap .word');
let current = 0;
if (words.length) {
    setInterval(() => {
        words[current].classList.remove('active');
        current = (current + 1) % words.length;
        words[current].classList.add('active');
    }, 2500);
}

// ── Row scroll arrows ──────────────────────────────────────
document.querySelectorAll('.row-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
        const rowId = btn.dataset.row;
        const track = document.getElementById(rowId);
        if (!track) return;
        const scrollAmt = track.clientWidth * 0.75;
        track.scrollBy({ left: btn.classList.contains('left') ? -scrollAmt : scrollAmt, behavior: 'smooth' });
    });
});

// ── Drag-to-scroll on rows ─────────────────────────────────
document.querySelectorAll('.row-track').forEach(track => {
    let isDown = false, startX, scrollLeft;
    track.addEventListener('mousedown', e => {
        isDown = true; track.style.cursor = 'grabbing';
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
    });
    track.addEventListener('mouseleave', () => { isDown = false; track.style.cursor = ''; });
    track.addEventListener('mouseup', () => { isDown = false; track.style.cursor = ''; });
    track.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        track.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });
});

// ── AI mock responses ──────────────────────────────────────
const aiResponses = {
    pps: '🆔 Para tirar seu PPS Number: agende no Intreo Centre mais próximo, leve passaporte + comprovante de endereço e preencha o formulário REG1. O número chega por carta em 5-7 dias úteis!',
    moradia: '🏠 Para encontrar moradia em Dublin: use Daft.ie e Rent.ie. Evite pagar depósito sem ver o imóvel. O preço médio de um quarto compartilhado é €800-1.200/mês.',
    banco: '🏦 Para abrir conta: o Revolut é o mais fácil (100% online, sem precisar de PPS). Para banco tradicional, o AIB e Bank of Ireland aceitam estudantes com passaporte e comprovante de endereço.',
    visto: '🪪 O Stamp 2 permite trabalhar até 20h/semana durante o período letivo e 40h/semana nas férias. Renove o IRP antes de vencer — não espere a última semana!',
    trabalho: '💼 Com Stamp 2 você pode trabalhar até 20h/semana. Use LinkedIn, Indeed.ie e Glassdoor para buscar vagas. Restaurantes e hotéis costumam contratar sem experiência prévia.',
    transporte: '🚌 O Leap Card é essencial! Compre em qualquer newsagent por €5 + saldo. O Dublin Bus, Luas e DART aceitam. Baixe o app "Transport for Ireland" para horários em tempo real.',
    saude: '🏥 Como estudante, você pode se registrar no HSE (serviço público de saúde). Procure um GP (médico de família) próximo à sua casa. Muitas clínicas têm taxa reduzida para estudantes.',
    default: 'Boa pergunta! 🤔 Tenho informações sobre PPS Number, moradia, conta bancária, visto, trabalho, transporte e saúde na Irlanda. Sobre qual tema quer saber mais?'
};

function getAIResponse(text) {
    const t = text.toLowerCase();
    if (t.includes('pps') || t.includes('número')) return aiResponses.pps;
    if (t.includes('morad') || t.includes('quarto') || t.includes('aluguel')) return aiResponses.moradia;
    if (t.includes('banco') || t.includes('conta') || t.includes('revolut')) return aiResponses.banco;
    if (t.includes('visto') || t.includes('stamp') || t.includes('irp')) return aiResponses.visto;
    if (t.includes('trabalh') || t.includes('emprego')) return aiResponses.trabalho;
    if (t.includes('transport') || t.includes('bus') || t.includes('leap')) return aiResponses.transporte;
    if (t.includes('saúde') || t.includes('médico') || t.includes('hospital')) return aiResponses.saude;
    return aiResponses.default;
}

function addMsg(container, text, isUser) {
    const div = document.createElement('div');
    div.className = 'msg ' + (isUser ? 'user' : 'bot');
    div.innerHTML = `<div class="bubble">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addTyping(container) {
    const div = document.createElement('div');
    div.className = 'msg bot typing-indicator';
    div.innerHTML = '<div class="bubble">⏳ Digitando...</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

// ── Demo chat (AI section) ─────────────────────────────────
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMsgs = document.getElementById('chatMessages');

function sendDemoMsg() {
    const raw = chatInput?.value.trim();
    if (!raw) return;
    if (!rateLimiter.allow()) { addMsg(chatMsgs, '⚠️ Muitas mensagens. Aguarde um momento.', false); return; }
    if (isSpam(raw)) return;
    const safe = sanitizeInput(raw);
    addMsg(chatMsgs, safe, true);
    chatInput.value = '';
    const typing = addTyping(chatMsgs);
    setTimeout(() => {
        typing.remove();
        addMsg(chatMsgs, getAIResponse(raw), false);
    }, 900);
}

chatSend?.addEventListener('click', sendDemoMsg);
chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendDemoMsg(); });

// ── Floating chat panel ────────────────────────────────────
const chatBubble = document.getElementById('chatBubble');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const chatPanelInput = document.getElementById('chatPanelInput');
const chatPanelSend = document.getElementById('chatPanelSend');
const chatPanelMsgs = document.getElementById('chatPanelMessages');
const openChatBtn = document.getElementById('openChatBtn');

chatBubble?.addEventListener('click', () => chatPanel.classList.toggle('open'));
chatClose?.addEventListener('click', () => chatPanel.classList.remove('open'));
openChatBtn?.addEventListener('click', () => {
    chatPanel.classList.add('open');
    chatPanelInput?.focus();
});

function sendPanelMsg() {
    const raw = chatPanelInput?.value.trim();
    if (!raw) return;
    if (!rateLimiter.allow()) { addMsg(chatPanelMsgs, '⚠️ Muitas mensagens. Aguarde um momento.', false); return; }
    if (isSpam(raw)) return;
    const safe = sanitizeInput(raw);
    addMsg(chatPanelMsgs, safe, true);
    chatPanelInput.value = '';
    const typing = addTyping(chatPanelMsgs);
    setTimeout(() => {
        typing.remove();
        addMsg(chatPanelMsgs, getAIResponse(raw), false);
    }, 900);
}

chatPanelSend?.addEventListener('click', sendPanelMsg);
chatPanelInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendPanelMsg(); });

// ── Fade-in on scroll ──────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ── Stats counter ──────────────────────────────────────────
const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.hstat-n').forEach(el => {
                const target = parseInt(el.dataset.target);
                let current = 0;
                const step = target / 60;
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        el.textContent = target >= 1000
                            ? target.toLocaleString('pt-BR')
                            : target + '+';
                        clearInterval(timer);
                    } else {
                        el.textContent = Math.floor(current).toLocaleString('pt-BR');
                    }
                }, 25);
            });
            statsObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObs.observe(heroStats);
