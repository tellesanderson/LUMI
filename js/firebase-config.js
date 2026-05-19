/* =============================================
   LUMI DECORAÇÕES — Configuração do Firebase
   ============================================= */

// Substitua os valores abaixo pelas credenciais obtidas no console do Firebase (Web App)
const firebaseConfig = {
  apiKey: "AIzaSyBRiRH8qpRk_8VWaLITLCz8TjwddwATG5Y",
  authDomain: "lumi-83a16.firebaseapp.com",
  projectId: "lumi-83a16",
  storageBucket: "lumi-83a16.firebasestorage.app",
  messagingSenderId: "86492953669",
  appId: "1:86492953669:web:7685c2254144fe1d8f372c",
  measurementId: "G-8R3FPKLKLD"
};

let isFirebaseConfigured = false;
let db = null;
let auth = null;

// Verifica se as credenciais foram preenchidas
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "SUA_API_KEY" && firebaseConfig.apiKey.trim() !== "") {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    isFirebaseConfigured = true;
    console.log("🔥 Firebase conectado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar o Firebase. Verifique as credenciais:", error);
  }
} else {
  console.warn("⚠️ Firebase não configurado. O site está rodando em modo local offline (fallback).");
}
