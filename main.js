/* ===== JORNADA DO INTERCÂMBIO — main.js ===== */

// ── SECURITY LAYER ───────────────────────────────────────────
function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    str = str.slice(0, 500);
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
    return str.replace(/[&<>"'/]/g, ch => map[ch]);
}
const rateLimiter = (() => {
    const ts = [], MAX = 10, WIN = 60000;
    return {
        allow() {
            const now = Date.now();
            while (ts.length && ts[0] < now - WIN) ts.shift();
            if (ts.length >= MAX) return false;
            ts.push(now); return true;
        }
    };
})();
let lastMsg = '';
function isSpam(t) { if (t === lastMsg) return true; lastMsg = t; return false; }

// ── AUTH INTEGRATION ─────────────────────────────────────────
(function initAuth() {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    const loggedIn = typeof JAuth !== 'undefined' && JAuth.isLoggedIn();
    const user = loggedIn ? JAuth.getCurrentUser() : null;

    if (loggedIn && user) {
        // Render user avatar + dropdown
        const initial = (user.name || 'U')[0].toUpperCase();
        navAuth.innerHTML = `
          <div class="nav-user">
            <span class="nav-user-name">${user.name.split(' ')[0]}</span>
            <div class="nav-avatar" tabindex="0" id="navAvatarBtn" aria-haspopup="true">
              ${initial}
              <div class="nav-dropdown" id="navDropdown">
                <a href="#">Meu Perfil</a>
                <a href="signup.html">Completar Cadastro</a>
                <div class="nd-divider"></div>
                <a href="privacy.html">Privacidade</a>
                <a href="terms.html">Termos</a>
                <div class="nd-divider"></div>
                <button class="nd-logout" id="btnLogout">Sair</button>
              </div>
            </div>
          </div>`;

        document.getElementById('navAvatarBtn')?.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('open');
        });
        document.addEventListener('click', () => document.getElementById('navAvatarBtn')?.classList.remove('open'));
        document.getElementById('btnLogout')?.addEventListener('click', () => { JAuth.logout(); window.location.reload(); });

        // Trial bar
        if (user.plan === 'trial') {
            const daysLeft = JAuth.trialDaysLeft ? JAuth.trialDaysLeft() : 3;
            if (daysLeft !== null && daysLeft >= 0) {
                const bar = document.createElement('div');
                bar.className = 'trial-bar';
                bar.id = 'trialBar';
                bar.innerHTML = `
                  <strong>⏳ ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} de trial restante${daysLeft !== 1 ? 's' : ''}</strong>
                  — Aproveite o acesso completo!
                  <a href="#pricing">Ver planos</a>
                  <span class="tb-close" id="trialClose">✕</span>`;
                document.body.prepend(bar);
                document.body.classList.add('has-trial-bar');
                document.getElementById('trialClose')?.addEventListener('click', () => {
                    bar.classList.add('hidden');
                    document.body.classList.remove('has-trial-bar');
                });
            }
        }

        // Welcome toast for new users
        const params = new URLSearchParams(window.location.search);
        if (params.get('welcome') === '1') {
            const toast = document.getElementById('welcomeToast');
            if (toast) {
                document.getElementById('wtLine1').textContent = `Olá, ${user.name.split(' ')[0]}! 🎉`;
                document.getElementById('wtLine2').textContent = 'Seu trial de 3 dias começou. Explore tudo!';
                setTimeout(() => toast.classList.add('show'), 500);
                document.getElementById('wtClose')?.addEventListener('click', () => toast.classList.remove('show'));
                setTimeout(() => toast.classList.remove('show'), 6000);
                // Clean URL without reload
                history.replaceState(null, '', window.location.pathname);
            }
        }

    } else {
        // Not logged in — show login + signup CTA
        navAuth.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center">
            <a href="login.html" class="btn btn-ghost btn-sm">Entrar</a>
            <a href="signup.html" class="nav-cta">Começar Grátis →</a>
          </div>`;
    }
})();

// ── AI PRE-FORM ──────────────────────────────────────────────
(function initPreForm() {
    const modal = document.getElementById('aiPreModal');
    const submitBtn = document.getElementById('pf-submit');
    const errEl = document.getElementById('preform-err');
    if (!modal || !submitBtn) return;

    // Pre-fill if user is logged in
    const user = typeof JAuth !== 'undefined' && JAuth.getCurrentUser();
    if (user) {
        const pf = document.getElementById('pf-name');
        const pe = document.getElementById('pf-email');
        const pp = document.getElementById('pf-phone');
        if (pf) pf.value = user.name || '';
        if (pe) pe.value = user.email || '';
        if (pp) pp.value = user.phone || '';
        const pc = document.getElementById('pf-consent');
        if (pc) { pc.checked = true; }
    }

    window._chatUserData = null; // will be set after form submit

    window.openAIChatPreForm = function () {
        // If already collected or user logged in, skip form
        if (window._chatUserData) return true;
        if (user) {
            window._chatUserData = { name: user.name, email: user.email, phone: user.phone || '' };
            return true;
        }
        modal.classList.add('open');
        document.getElementById('pf-name')?.focus();
        return false;
    };

    submitBtn.addEventListener('click', () => {
        const name = document.getElementById('pf-name').value.trim();
        const email = document.getElementById('pf-email').value.trim();
        const phone = document.getElementById('pf-phone').value.trim();
        const consent = document.getElementById('pf-consent').checked;

        if (!name) { showPreErr('Informe seu nome.'); return; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showPreErr('Informe um e-mail válido.'); return; }
        if (!phone) { showPreErr('Informe seu telefone.'); return; }
        if (!consent) { showPreErr('É necessário aceitar a Política de Privacidade.'); return; }

        window._chatUserData = { name, email, phone };
        // Salva lead no Firestore
        if (typeof JDB !== 'undefined') JDB.saveLead({ name, email, phone, source: 'ai-chat' }).catch(() => { });
        modal.classList.remove('open');

        // Focus chat input
        setTimeout(() => {
            document.getElementById('chatInput')?.focus();
            document.getElementById('chatToggle')?.click();
        }, 300);
    });

    // Enter key on last field
    document.getElementById('pf-phone')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });

    function showPreErr(msg) {
        if (!errEl) return;
        errEl.textContent = msg;
        errEl.classList.add('show');
        setTimeout(() => errEl.classList.remove('show'), 4000);
    }
})();

// ── NAVBAR ───────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60));

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
}));


// ── ROW ARROWS ───────────────────────────────────────────────
document.querySelectorAll('.row-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
        const track = document.getElementById(btn.dataset.row);
        if (!track) return;
        track.scrollBy({ left: btn.classList.contains('left') ? -(track.clientWidth * 0.75) : track.clientWidth * 0.75, behavior: 'smooth' });
    });
});

// ── DRAG-TO-SCROLL ───────────────────────────────────────────
document.querySelectorAll('.row-track').forEach(track => {
    let down = false, startX, scrollLeft;
    track.addEventListener('mousedown', e => { down = true; track.style.cursor = 'grabbing'; startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; });
    track.addEventListener('mouseleave', () => { down = false; track.style.cursor = ''; });
    track.addEventListener('mouseup', () => { down = false; track.style.cursor = ''; });
    track.addEventListener('mousemove', e => { if (!down) return; e.preventDefault(); track.scrollLeft = scrollLeft - (e.pageX - track.offsetLeft - startX) * 1.5; });
});

// ── AI — INTÉRPRETE CONTEXTUAL IRLANDÊS ──────────────────────
// Vocabulário: mapeamento de termos irlandeses para contexto real
const irelandContext = {
    // Saúde
    gp: '🏥 **GP** (General Practitioner) é o **médico de família** na Irlanda. Você precisa se registrar em uma clínica GP perto de casa. Use findagp.ie para localizar um. A consulta custa €50–70/visita. Se tiver renda baixa, pode pedir **Medical Card** pelo myhse.ie, que torna as consultas gratuitas. Precisa de ajuda para se registrar?',
    hse: '🏥 O **HSE** (Health Service Executive) é o sistema público de saúde da Irlanda, equivalente ao SUS. Ele cobre hospitais públicos, emergências e alguns serviços gratuitos. Para acesso completo, registre-se em um **GP** primeiro. hse.ie tem lista de serviços.',
    medicalcard: '🃏 O **Medical Card** dá acesso gratuito a GP, medicamentos e alguns serviços hospitalares. Para estudantes com Stamp 2, a elegibilidade depende da renda. Acesse mygov.ie ou vá ao Intreo Centre da sua área.',
    hospital: '🏥 Se for urgência mas não emergência, procure um **GP** primeiro. Para emergências, vá ao **A&E** (Accident & Emergency) do hospital mais próximo. Os principais em Dublin: St. Vincent\'s, Beaumont, Mater e St. James\'s.',
    farmacia: '💊 Farmácias na Irlanda se chamam **Pharmacy** ou **Chemist**. As principais redes são Boots, McCauley e Lloyds. Medicamentos com receita (prescrição do GP) têm taxa de €1,50/item com Medical Card, ou ~€1,50–15 sem.',

    // Documentos
    pps: '📋 O **PPS Number** (Personal Public Service Number) é como o CPF irlandês. Você precisa dele para trabalhar, abrir conta bancária e acessar serviços públicos. **Como tirar:** 1) Agende no Intreo Centre da sua área; 2) Leve passaporte + comprovante de endereço em Dublin (contrato, carta do banco ou da escola); 3) Preencha o formulário REG1. O número chega por carta em 5–7 dias úteis.',
    irp: '🪪 O **IRP** (Irish Residence Permit) é o cartão de visto irlandês — seu Stamp 2. Você precisa agendá-lo dentro de 90 dias de entrada na Irlanda no inis.ie. Leve: passaporte, comprovante de matrícula na escola, extrato bancário (mín. €3.000), seguro de saúde e €300 em dinheiro. Renove antes de vencer!',
    stamp2: '🪪 O **Stamp 2** é o visto de estudante da Irlanda. Com ele você pode trabalhar até **20h/semana** durante o período letivo e **40h/semana** nas férias escolares. Não tem permissão para trabalho autônomo. Renove o IRP antes de vencer — acesse inis.ie para agendamento.',
    eircode: '📮 O **Eircode** é o CEP irlandês, com 7 caracteres (ex: D01 F5P2). Use eircode.ie para encontrar o seu. É necessário para receber correspondências e se registrar em serviços.',

    // Finanças
    revenue: '💰 O **Revenue Commissioners** é a Receita Federal irlandesa. Você precisa se registrar no myrevenue.ie para receber seu **Tax Credit Certificate** antes de começar a trabalhar — sem isso o empregador retém mais imposto. O Revenue também processa a declaração anual (**P60**) e devoluções de imposto.',
    imposto: '📊 Na Irlanda você paga: **USC** (até 4,5% sobre salário), **PRSI** (4% de previdência) e **Income Tax** (20% até €40k, 40% acima). Como estudante trabalhando 20h/semana, provavelmente estará na faixa de 20%. Registre-se no Revenue antes de começar o trabalho!',
    p60: '📄 O **P60** é o comprovante anual de rendimentos e impostos pagos na Irlanda. Seu empregador emite em abril/maio. Use-o para solicitar devolução de imposto no Revenue Online (myrevenue.ie) — muitos estudantes têm imposto a receber!',
    prsi: '📋 o **PRSI** (Pay Related Social Insurance) é a contribuição previdenciária irlandesa, 4% do salário. Com PRSI você pode ter acesso a alguns benefícios sociais. Estudantes com Stamp 2 pagam PRSI quando trabalham.',
    wise: '💸 O **Wise** (antigo TransferWise) é a melhor opção para enviar dinheiro entre Irlanda e Brasil com taxas reduzidas. Alternativas: Remitly e Western Union. Evite transferir pelo banco tradicional — a taxa é muito maior.',

    // Moradia
    daft: '🏠 **Daft.ie** é o maior portal de aluguéis da Irlanda — como o Zap Imóveis brasileiro. Use também Rent.ie e Roomlala. Dicas importantes: Nunca pague depósito sem ver o imóvel presencialmente. Peça sempre contrato escrito (Lease Agreement). Aluguel médio em Dublin: €900–1.300/mês por quarto compartilhado.',
    leva: '🏠 Ao assinar um contrato de aluguel na Irlanda, você normalmente paga: 1 mês de depósito + 1 mês adiantado. O depósito deve ser devolvido ao sair (se não houver danos). Registre-se no RTB (Residential Tenancies Board) — é seu direito como inquilino.',

    // Transporte
    luas: '🚃 O **Luas** é o metrô de superfície (VLT) de Dublin. Tem 2 linhas: **Linha Verde** (norte-sul, passando por St. Stephen\'s Green) e **Linha Vermelha** (leste-oeste, passando por Heuston). Use o **Leap Card** para pagar — sai muito mais barato que bilhete avulso.',
    dart: '🚂 O **DART** (Dublin Area Rapid Transit) é o trem que liga o litoral norte ao litoral sul de Dublin — de Malahide/Howth até Greystones. Ótimo para quem mora ou quer visitar cidades costeiras como Dún Laoghaire, Howth ou Bray.',
    dublinbus: '🚌 O **Dublin Bus** é a principal rede de ônibus da cidade, com centenas de rotas. Baixe o app **Transport for Ireland** (TFI) para ver horários e planejar rotas. Use o Leap Card — é mais barato e não precisa de troco.',
    leapcard: '💳 O **Leap Card** é o bilhete inteligente do transporte público irlandês. Compre em qualquer newsagent (€5 + saldo). Funciona no Dublin Bus, Luas, DART, commuter rail e alguns ônibus interurbanos. Recarregue no app TFI ou em máquinas nas estações.',
    bus: '🚌 Para andar de ônibus em Dublin, use o **Dublin Bus** com **Leap Card**. O app **Transport for Ireland** (TFI) mostra horários em tempo real. O percurso médio custa €1,40–2,60 com Leap Card vs €2–3,60 em dinheiro.',

    // Trabalho
    trabalho: '💼 Com **Stamp 2** você pode trabalhar até **20h/semana** durante o período letivo e **40h/semana** nas férias. Para procurar emprego: LinkedIn, Indeed.ie, Jobs.ie. Restaurantes, cafés, hotéis e supermercados contratam frequentemente sem exigir muita experiência. Lembre de registrar no **Revenue** antes de começar!',
    cv: '📝 O CV irlandês é diferente do brasileiro: não inclui foto, estado civil ou CPF. Máximo 2 páginas. Sempre com "Personal Statement" no início. Use uma conta de email profissional. Se precisar de ajuda, pergunte — posso dar um modelo!',

    // Escola
    seda: '🎓 O **Seda College** é uma das escolas de inglês mais reconhecidas de Dublin, parceira oficial da Jornada do Intercâmbio. Fica no centro de Dublin. Para mais informações, fale com nossa equipe.',
    cao: '🎓 O **CAO** (Central Applications Office) é o sistema de candidatura para cursos universitários na Irlanda — como o SiSU brasileiro. Se estiver pensando em cursar graduação ou pós-graduação numa universidade irlandesa, o CAO é por onde você aplica.',
    susi: '🎓 O **SUSI** (Student Universal Support Ireland) é o programa de bolsas de estudo para alunos de cursos de nível superior na Irlanda. Para estudantes internacionais com Stamp 2 em cursos language, geralmente não há elegibilidade — mas vale checar em susi.ie.',

    // Segurança / Cidadania
    garda: '👮 A **Garda Síochána** é a polícia irlandesa (como a Polícia Civil/Militar no Brasil). Em Dublin, o principal GNECB (Garda National Exhibition Centre Bureau) para registro de estrangeiros fica na Burgh Quay. Se for vítima de crime, ligue 999 (emergência) ou vá à delegacia (Garda Station) mais próxima.',

    // Geral
    default: 'Boa pergunta! 🤔 Posso ajudar com: **GP** (médico), **Daft** (aluguel), **Revenue** (imposto), **LUAS/DART** (transporte), **PPS Number**, **Stamp 2**, **conta bancária** e muito mais. Me diga o que precisa!'
};

// Motor de interpretação — busca por múltiplos padrões
function getAIResponse(raw, user) {
    const t = raw.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos para comparação
        .replace(/[^a-z0-9\s]/g, ' ');

    // Personalization helpers
    const name = user ? (user.name.split(' ')[0] || 'Viajante') : '';
    const school = user?.onboarding?.school;
    const visa = user?.onboarding?.visa;
    const arrival = user?.onboarding?.arrivalDate;

    // Greeting
    if (/\boi\b|\bolá\b|\bhello\b|\btudo.?bem\b/.test(t)) {
        return `Olá${name ? ', ' + name : ''}! 👋 Como posso ajudar na sua jornada para a Irlanda hoje?`;
    }

    // Saúde
    if (/\bgp\b|medico|doctor|clinica|consulta|medical.?card|cartao.?medico/.test(t)) return irelandContext.gp;
    if (/\bhse\b|sistema.?saude|servico.?saude/.test(t)) return irelandContext.hse;
    if (/hospital|emergencia|urgencia|pronto.?socorro|ae\b/.test(t)) return irelandContext.hospital;
    if (/farmacia|remedio|medicamento|receita|chemist/.test(t)) return irelandContext.farmacia;

    // Documentos
    if (/\bpps\b|numero.?pps|personal.?public/.test(t)) {
        let msg = irelandContext.pps;
        if (arrival) {
            const arrDate = new Date(arrival);
            const today = new Date();
            if (arrDate > today) msg += ` <br><br>💡 Como você chega em <strong>${arrDate.toLocaleDateString('pt-BR')}</strong>, lembre-se de agendar seu PPS logo após ter um comprovante de endereço!`;
        }
        return msg;
    }
    if (/\birp\b|cartao.?visto|visto.?cartao|residence.?permit/.test(t)) return irelandContext.irp;
    if (/stamp.?2|visto.?estudante|estudante.?visto/.test(t)) return irelandContext.stamp2;
    if (/eircode|cep|codigo.?postal|codigo.?postl/.test(t)) return irelandContext.eircode;

    // Finanças / Imposto
    if (/\brevenue\b|receita.?federal|imposto.?irlanda|tax.?ireland/.test(t)) return irelandContext.revenue;
    if (/\bp60\b|comprovante.?rend|declaracao.?rend/.test(t)) return irelandContext.p60;
    if (/\bprsi\b|previdencia.?irlanda/.test(t)) return irelandContext.prsi;
    if (/\busc\b|imposto.?rend|income.?tax|quanto.?pag.?imposto/.test(t)) return irelandContext.imposto;
    if (/\bwise\b|remessa|transferencia|enviar.?dinheiro|mandar.?dinheiro/.test(t)) return irelandContext.wise;
    if (/banco|conta.?bancaria|revolut|aib|bank.?ireland|abrir.?conta/.test(t))
        return '🏦 Para abrir conta bancária: **Revolut** é o mais fácil — 100% online, sem precisar de PPS Number. Para bancos tradicionais (AIB, Bank of Ireland, KBC), você vai precisar do PPS Number e comprovante de endereço. O AIB tem agência no centro de Dublin com atendimento a estudantes.';

    // Moradia
    if (/\bdaft\b|daft\.ie|aluguel|arrendam|quarto|flat\b|apartam|moradia|morar|onde.?morar/.test(t)) return irelandContext.daft;
    if (/deposito|contrato.?aluguel|lease|inquilino|rtb/.test(t)) return irelandContext.leva;

    // Transporte
    if (/\bluas\b/.test(t)) return irelandContext.luas;
    if (/\bdart\b/.test(t)) return irelandContext.dart;
    if (/dublin.?bus|onibus|autocarro/.test(t)) return irelandContext.dublinbus;
    if (/leap.?card|leapcard/.test(t)) return irelandContext.leapcard;
    if (/transport|como.?andar|como.?ir|metro|tram/.test(t)) return irelandContext.bus;

    // Trabalho / CV
    if (/trabalh|emprego|vaga|job|linkedin|indeed|part.?time/.test(t)) {
        let msg = irelandContext.trabalho;
        if (visa === 'stamp2') {
            msg += ` <br><br>📌 Como estudante (Stamp 2), lembre-se do limite de <strong>20h semanais</strong> durante as aulas!`;
        }
        return msg;
    }
    if (/\bcv\b|curriculo|resume/.test(t)) return irelandContext.cv;

    // Escola
    if (/\bseda\b|seda.?college/.test(t)) return irelandContext.seda;
    if (/escola|estudar|curso|ingles|english|aula/.test(t)) {
        if (school === 'seda') return `🎓 Você vai estudar na <strong>Seda College</strong>? Ótima escolha! Ela é super bem localizada em Dublin 1 e tem ótimos professores. Aproveite as atividades extras e o clube de conversação!`;
        return irelandContext.seda; // Default response about schools
    }

    if (/\bcao\b|universidade|college|graduacao|pos.?graduacao/.test(t)) return irelandContext.cao;
    if (/\bsusi\b|bolsa|scholarship/.test(t)) return irelandContext.susi;

    // Segurança
    if (/garda|policia|delegacia|registro.?estrangeiro|burgh.?quay/.test(t)) return irelandContext.garda;

    return irelandContext.default;
}

// Formata resposta com markdown simples
function formatMsg(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function addMsg(container, text, isUser) {
    const div = document.createElement('div');
    div.className = 'msg ' + (isUser ? 'user' : 'bot');
    const bub = document.createElement('div');
    bub.className = 'bubble';
    if (isUser) {
        bub.textContent = text; // usuário — texto puro (seguro)
    } else {
        bub.innerHTML = formatMsg(text); // bot — HTML formatado (conteúdo controlado)
    }
    div.appendChild(bub);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addTyping(container) {
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.innerHTML = '<div class="bubble" style="opacity:0.6">Digitando…</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

// ── DEMO CHAT ────────────────────────────────────────────────
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMsgs = document.getElementById('chatMessages');

function sendDemo() {
    const raw = chatInput?.value.trim();
    if (!raw) return;
    if (!rateLimiter.allow()) { addMsg(chatMsgs, '⚠️ Aguarde um momento antes de enviar mais mensagens.', false); return; }
    if (isSpam(raw)) return;
    addMsg(chatMsgs, sanitizeInput(raw), true);
    chatInput.value = '';
    const t = addTyping(chatMsgs);
    const user = typeof JAuth !== 'undefined' ? JAuth.getCurrentUser() : null;
    setTimeout(() => { t.remove(); addMsg(chatMsgs, getAIResponse(raw, user), false); }, 800);
}
chatSend?.addEventListener('click', sendDemo);
chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendDemo(); });

// ── FLOATING PANEL ───────────────────────────────────────────
const chatBubble = document.getElementById('chatBubble');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const panelInput = document.getElementById('chatPanelInput');
const panelSend = document.getElementById('chatPanelSend');
const panelMsgs = document.getElementById('chatPanelMessages');
const openChatBtn = document.getElementById('openChatBtn');

chatBubble?.addEventListener('click', () => {
    const hasData = typeof openAIChatPreForm === 'function' ? openAIChatPreForm() : true;
    if (hasData) chatPanel.classList.toggle('open');
});
chatClose?.addEventListener('click', () => chatPanel.classList.remove('open'));
openChatBtn?.addEventListener('click', () => {
    const hasData = typeof openAIChatPreForm === 'function' ? openAIChatPreForm() : true;
    if (hasData) { chatPanel.classList.add('open'); panelInput?.focus(); }
});

function sendPanel() {
    const raw = panelInput?.value.trim();
    if (!raw) return;
    if (!rateLimiter.allow()) { addMsg(panelMsgs, '⚠️ Aguarde um momento antes de enviar mais mensagens.', false); return; }
    if (isSpam(raw)) return;
    addMsg(panelMsgs, sanitizeInput(raw), true);
    panelInput.value = '';
    const t = addTyping(panelMsgs);
    const user = typeof JAuth !== 'undefined' ? JAuth.getCurrentUser() : null;
    setTimeout(() => { t.remove(); addMsg(panelMsgs, getAIResponse(raw, user), false); }, 800);
}
panelSend?.addEventListener('click', sendPanel);
panelInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendPanel(); });

// ── SCROLL REVEAL ────────────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            revealObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObs.observe(el));

// ── STATS COUNTER ────────────────────────────────────────────
const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.hstat-n').forEach(el => {
                const target = parseInt(el.dataset.target);
                let cur = 0; const step = target / 60;
                const timer = setInterval(() => {
                    cur += step;
                    if (cur >= target) {
                        el.textContent = target >= 1000 ? target.toLocaleString('pt-BR') : target + '+';
                        clearInterval(timer);
                    } else {
                        el.textContent = Math.floor(cur).toLocaleString('pt-BR');
                    }
                }, 25);
            });
            statsObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObs.observe(heroStats);
