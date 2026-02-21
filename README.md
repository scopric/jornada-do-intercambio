# Jornada do Intercâmbio 🇮🇪

Plataforma educacional para brasileiros em intercâmbio na Irlanda.

## 🌐 Domínio
- **Domínio:** jornadadointercambioie.com
- **Registrar:** Squarespace Domains
- **DNS:** Google Cloud DNS (NS-CLOUD-A1..A4.GOOGLEDOMAINS.COM)
- **Expira:** 2027-02-19
- **País registrante:** BR
- **Contato WHOIS:** https://domains.squarespace.com/whois-contact-form

## 🔧 Configurar DNS (Google Cloud Console)
1. Acesse https://console.cloud.google.com → Network Services → Cloud DNS
2. Localize a zona do domínio `jornadadointercambioie.com`
3. Adicione registros A do GitHub Pages:
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153
4. Adicione CNAME `www` → `jornadadointercambioie.com.`
5. No GitHub: Settings → Pages → Custom domain → `jornadadointercambioie.com`

## 📁 Estrutura
| Arquivo | Descrição |
|---|---|
| `index.html` | Página principal (landing + hero + browse + pricing + IA) |
| `style.css` | Design system completo (dark theme, tokens, mobile) |
| `main.js` | Lógica → IA contextual irlandesa, carrossel, auth UI, chat |
| `auth.js` | Autenticação (localStorage + Firestore) + trial de 3 dias |
| `db.js` | Wrapper Firebase Firestore (leads, feedbacks, usuários) |
| `firebase-config.js` | Credenciais Firebase |
| `cookie-consent.js` | Banner de consentimento LGPD/GDPR |
| `login.html` | Login e cadastro rápido |
| `signup.html` | Onboarding em 3 etapas |
| `privacy.html` | Política de Privacidade (LGPD + GDPR) |
| `terms.html` | Termos de Serviço |
| `admin.html` | Painel admin — leads, feedbacks (senha: jornada@admin2025) |
| `hero-seda.jpg` | Imagem principal da landing page |
| `logo.svg` / `logo-full.jpg` | Identidade visual |
| `CNAME` | Domínio customizado GitHub Pages |
| `.github/workflows/` | CI — deploy automático via Firebase token |

## 🚀 Deploy
- **GitHub Pages:** https://scopric.github.io/jornada-do-intercambio
- **Domínio final:** https://jornadadointercambioie.com

## ⚙️ Como rodar localmente

### Opção 1 — Antigravity / Vite (porta 5173)
```bash
npx vite
```
Acesse: http://localhost:5173

### Opção 2 — Serve simples (porta 3000)
```bash
npx serve .
```
Acesse: http://localhost:3000

### Opção 3 — Python (porta 8000)
```bash
python3 -m http.server 8000
```
Acesse: http://localhost:8000

## 🛠️ Stack
- **Frontend:** HTML + Vanilla CSS + JavaScript (sem framework)
- **Fonte:** Google Fonts — Outfit + Inter
- **Backend:** Firebase Firestore (leads, feedbacks)
- **Auth:** localStorage + Firestore sync
- **Hospedagem:** GitHub Pages + domínio customizado
- **CI/CD:** GitHub Actions → Firebase deploy
