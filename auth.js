// ---------- SIP · Control de acceso (Supabase Auth) ----------
// Este archivo se carga ANTES que app.js y decide si app.js llega a ejecutarse.
// Nadie ve el contenido de la app (casos, normas, etc.) sin haber iniciado sesión.

const SUPABASE_URL = "https://xcfdhwqjudzngvlssyeg.supabase.co";
const SUPABASE_KEY = "sb_publishable_SMfnQmaqkzsFXn23qDriEQ_tG-Xb_Jd"; // clave pública, segura de exponer en el navegador

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authScreen = document.getElementById("auth-screen");
const appRoot = document.getElementById("app-root");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("auth-error");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

function showApp() {
  authScreen.style.display = "none";
  appRoot.style.display = "grid";
  // app.js solo se inyecta una vez, y solo después de confirmar sesión activa
  if (!window.__sipAppLoaded) {
    window.__sipAppLoaded = true;
    const script = document.createElement("script");
    script.src = "app.js";
    document.body.appendChild(script);
  }
}

function showLogin() {
  appRoot.style.display = "none";
  authScreen.style.display = "flex";
}

function setError(message) {
  loginError.textContent = message;
  loginError.style.display = message ? "block" : "none";
}

async function checkSession() {
  const { data } = await sb.auth.getSession();
  if (data && data.session) {
    showApp();
  } else {
    showLogin();
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setError("");
  loginBtn.disabled = true;
  loginBtn.textContent = "Ingresando...";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await sb.auth.signInWithPassword({ email, password });

  loginBtn.disabled = false;
  loginBtn.textContent = "Ingresar";

  if (error) {
    setError("Correo o contraseña incorrectos.");
  } else {
    showApp();
  }
});

logoutBtn.addEventListener("click", async () => {
  await sb.auth.signOut();
  window.location.reload();
});

checkSession();
