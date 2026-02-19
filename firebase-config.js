/* ===== JORNADA DO INTERCÂMBIO — firebase-config.js ===== */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuSaL0-SCYBbcha4Mhu-9bY_2adIfdudM",
  authDomain: "jornada-intercambio.firebaseapp.com",
  projectId: "jornada-intercambio",
  storageBucket: "jornada-intercambio.firebasestorage.app",
  messagingSenderId: "295607221175",
  appId: "1:295607221175:web:a7742d1ebeb9ca97120632",
  measurementId: "G-Y0G3B7R8Y6"
};

// Inicializa apenas uma vez
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Exporta para uso nos outros módulos
export { app, db, analytics, firebaseConfig };

// Compatibilidade com scripts não-módulo (db.js, admin.html)
window.__FIREBASE_APP__ = app;
window.__FIREBASE_DB__ = db;
window.__FIREBASE_CONFIG__ = firebaseConfig;
