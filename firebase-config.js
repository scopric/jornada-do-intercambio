/* ===================================================
   JORNADA DO INTERCÂMBIO — firebase-config.js
   ===================================================
   PASSO A PASSO PARA CONFIGURAR:

   1. Acesse https://console.firebase.google.com
   2. Clique "Criar projeto" → nome: jornada-intercambio
   3. No menu esquerdo: "Firestore Database" → "Criar banco de dados"
      → Escolha o servidor: europe-west1 (Irlanda!) → Modo produção
   4. No menu esquerdo: "Visão geral do projeto" (⚙️ engrenagem)
      → "Configurações do projeto" → aba "Geral"
      → Role até "Seus apps" → clique "</> Web"
      → Registre o app (nome: jornada-web)
      → Copie o objeto firebaseConfig abaixo e substitua os valores

   5. No Firestore → "Regras" → cole estas regras e publique:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Usuários: apenas o próprio usuário pode ler/escrever seus dados
       match /users/{email} {
         allow create: if true;
         allow read, update: if true;  // proteger melhor no futuro c/ Auth
       }
       // Leads do chat: qualquer um pode criar, admin lê
       match /leads/{id} {
         allow create: if true;
         allow read: if false; // somente via admin (server-side no futuro)
       }
     }
   }
   =================================================== */

// ── Substituir com suas credenciais do Firebase Console ──────
const firebaseConfig = {
    apiKey: "COLE_AQUI_SUA_API_KEY",
    authDomain: "COLE_AQUI.firebaseapp.com",
    projectId: "COLE_AQUI_SEU_PROJECT_ID",
    storageBucket: "COLE_AQUI.appspot.com",
    messagingSenderId: "COLE_AQUI_SENDER_ID",
    appId: "COLE_AQUI_APP_ID",
    measurementId: "COLE_AQUI_MEASUREMENT_ID"  // opcional — Analytics
};

// ── Inicialização ─────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

let _app, _db, _analytics;

function _init() {
    if (_app) return;
    try {
        _app = initializeApp(firebaseConfig);
        _db = getFirestore(_app);
        _analytics = getAnalytics(_app);
    } catch (e) {
        console.warn('[Firebase] Falha na inicialização — verifique as credenciais.', e);
    }
}

_init();

export { _db as db, _analytics as analytics, firebaseConfig };
