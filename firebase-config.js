/* ===================================================
   JORNADA DO INTERCÂMBIO — firebase-config.js
   ===================================================

   ✅ JÁ PREENCHIDO:
   - projectId, authDomain, storageBucket, messagingSenderId

   ⚠️  FALTA PREENCHER (1 minuto):
   1. Acesse: https://console.firebase.google.com/project/jornada-intercambio/settings/general
   2. Role até "Seus apps" → clique no app "jornada-web"
      (Se não criou ainda: clique no ícone </> Web → nome: jornada-web → Registrar)
   3. Copie os valores de:
      - apiKey        → cole em API_KEY abaixo
      - appId         → cole em APP_ID abaixo
      - measurementId → cole em MEASUREMENT_ID (opcional)

   REGRAS DO FIRESTORE:
   Acesse: https://console.firebase.google.com/project/jornada-intercambio/firestore/rules
   Cole estas regras e clique "Publicar":

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{email} {
         allow read, write: if true;
       }
       match /leads/{id} {
         allow create: if true;
         allow read: if false;
       }
     }
   }
   =================================================== */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "COLE_AQUI_A_API_KEY",          // ← único campo a preencher
  authDomain: "jornada-intercambio.firebaseapp.com",
  projectId: "jornada-intercambio",
  storageBucket: "jornada-intercambio.firebasestorage.app",
  messagingSenderId: "COLE_AQUI_SENDER_ID",           // ← copiar do console
  appId: "COLE_AQUI_O_APP_ID",            // ← copiar do console
  measurementId: ""                               // opcional
};

// Inicializa apenas uma vez (evita erro no hot-reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporta para db.js e admin.html
export { app, db, firebaseConfig };

// Compatibilidade com scripts não-módulo
window.__FIREBASE_APP__ = app;
window.__FIREBASE_DB__ = db;
window.__FIREBASE_CONFIG__ = firebaseConfig;
