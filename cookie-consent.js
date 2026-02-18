/* ===== JORNADA — cookie-consent.js ===== */
const JCookies = (() => {
    const KEY = 'jdi_cookies';

    function getPrefs() {
        try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
    }

    function savePrefs(prefs) {
        localStorage.setItem(KEY, JSON.stringify({ ...prefs, savedAt: Date.now() }));
    }

    function applyPrefs(prefs) {
        if (prefs.analytics) {
            // Aqui você ativaria Google Analytics, Plausible etc.
            // window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
        }
        if (prefs.marketing) {
            // Meta Pixel, TikTok Pixel etc.
        }
    }

    function hideBanner() {
        document.getElementById('cookieBanner')?.classList.remove('show');
    }

    function init() {
        const prefs = getPrefs();
        if (prefs) { applyPrefs(prefs); return; } // já consentido

        // Injetar banner
        const banner = document.createElement('div');
        banner.id = 'cookieBanner';
        banner.className = 'cookie-banner';
        banner.innerHTML = `
      <div class="cb-content">
        <div class="cb-text">
          <p><strong>🍪 Usamos cookies</strong></p>
          <p>Usamos cookies e tecnologias similares para melhorar sua experiência, personalizar conteúdo e analisar o tráfego do site, conforme nossa <a href="privacy.html" target="_blank">Política de Privacidade</a>. Você pode personalizar suas preferências ou aceitar todos.</p>
        </div>
        <div class="cb-actions">
          <button class="cb-btn cb-customize" id="cbCustomize">Personalizar</button>
          <button class="cb-btn cb-reject" id="cbReject">Recusar não essenciais</button>
          <button class="cb-btn cb-accept" id="cbAccept">Aceitar todos</button>
        </div>
      </div>
      <div class="cb-modal" id="cbModal" style="display:none">
        <div class="cb-modal-inner">
          <h3>Preferências de cookies</h3>
          <p>Gerencie quais cookies você aceita. Os essenciais não podem ser desativados.</p>
          <div class="cb-option">
            <div><strong>Essenciais</strong><br><small>Login, segurança, funcionamento básico</small></div>
            <label class="cb-toggle"><input type="checkbox" checked disabled /><span></span></label>
          </div>
          <div class="cb-option">
            <div><strong>Analíticos</strong><br><small>Nos ajudam a entender como o site é usado</small></div>
            <label class="cb-toggle"><input type="checkbox" id="cbAnalytics" /><span></span></label>
          </div>
          <div class="cb-option">
            <div><strong>Marketing</strong><br><small>Publicidade personalizada nas redes sociais</small></div>
            <label class="cb-toggle"><input type="checkbox" id="cbMarketing" /><span></span></label>
          </div>
          <div class="cb-option">
            <div><strong>Funcionais</strong><br><small>Preferências salvas, língua, tema</small></div>
            <label class="cb-toggle"><input type="checkbox" id="cbFunctional" checked /><span></span></label>
          </div>
          <div class="cb-modal-actions">
            <button class="cb-btn cb-reject" id="cbSavePrefs">Salvar preferências</button>
            <button class="cb-btn cb-accept" id="cbAcceptAll2">Aceitar todos</button>
          </div>
        </div>
      </div>
    `;
        document.body.appendChild(banner);
        setTimeout(() => banner.classList.add('show'), 800);

        document.getElementById('cbAccept').onclick = () => {
            const p = { essential: true, analytics: true, marketing: true, functional: true };
            savePrefs(p); applyPrefs(p); hideBanner();
        };
        document.getElementById('cbReject').onclick = () => {
            const p = { essential: true, analytics: false, marketing: false, functional: false };
            savePrefs(p); hideBanner();
        };
        document.getElementById('cbCustomize').onclick = () => {
            document.getElementById('cbModal').style.display = 'flex';
        };
        document.getElementById('cbSavePrefs').onclick = () => {
            const p = {
                essential: true,
                analytics: document.getElementById('cbAnalytics').checked,
                marketing: document.getElementById('cbMarketing').checked,
                functional: document.getElementById('cbFunctional').checked,
            };
            savePrefs(p); applyPrefs(p); hideBanner();
        };
        document.getElementById('cbAcceptAll2').onclick = () => {
            const p = { essential: true, analytics: true, marketing: true, functional: true };
            savePrefs(p); applyPrefs(p); hideBanner();
        };
    }

    return { init, getPrefs };
})();

document.addEventListener('DOMContentLoaded', () => JCookies.init());
