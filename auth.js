// auth.js — Puerta de acceso con Supabase Authentication
// La app (data.js / app.js) solo se ejecuta después de un login exitoso.

const SUPABASE_URL = "https://xcfdhwqjudzngvlssyeg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SMfnQmaqkzsFXn23qDriEQ_tG-Xb_Jd";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginScreen = document.getElementById("login-screen");
const appRoot = document.querySelector(".app");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const submitBtn = document.getElementById("login-submit");
const errorMsg = document.getElementById("login-error");

function showApp() {
  loginScreen.style.display = "none";
  appRoot.style.display = "flex";
  // Notifica a app.js (si ya cargó) que puede iniciar el render.
  window.dispatchEvent(new Event("sip-authenticated"));
}

function showLogin() {
  appRoot.style.display = "none";
  loginScreen.style.display = "flex";
}

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showApp();
  } else {
    showLogin();
  }
}

submitBtn.addEventListener("click", async () => {
  errorMsg.style.display = "none";
  submitBtn.disabled = true;
  submitBtn.textContent = "Ingresando...";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value
  });
  submitBtn.disabled = false;
  submitBtn.textContent = "Ingresar";
  if (error) {
    errorMsg.style.display = "block";
    return;
  }
  showApp();
});

// Permite iniciar sesión presionando Enter en el campo de contraseña.
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitBtn.click();
});

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      showLogin();
    });
  }
});

checkSession();
