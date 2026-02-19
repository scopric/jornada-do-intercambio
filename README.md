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
| `index.html` | Página principal |
| `style.css` | Design system |
| `main.js` | Lógica + IA contextual irlandesa |
| `auth.js` | Autenticação (localStorage + Firestore) |
| `db.js` | Wrapper Firebase Firestore |
| `firebase-config.js` | Credenciais Firebase (preencher) |
| `cookie-consent.js` | Banner LGPD/GDPR |
| `login.html` | Login e cadastro rápido |
| `signup.html` | Onboarding 3 etapas |
| `privacy.html` | Política de Privacidade LGPD+GDPR |
| `terms.html` | Termos de Serviço |
| `admin.html` | Painel admin (senha: jornada@admin2025) |
| `CNAME` | Domínio customizado GitHub Pages |

## 🚀 Deploy
- GitHub Pages: https://scopric.github.io/jornada-do-intercambio
- Domínio final: https://jornadadointercambioie.com

## ⚙️ Como rodar localmente
```
npx serve .
```
Acesse: http://localhost:3000
