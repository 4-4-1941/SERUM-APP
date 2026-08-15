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
  window.dispatchEvent(new Event("sip-authenticated"));
}

function showLogin() {
  appRoot.style.display = "none";
  loginScreen.style.display = "flex";
}

async function checkSession() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      showApp();
    } else {
      showLogin();
    }
  } catch (err) {
    console.error("Error checking session:", err);
    showLogin();
  }
}

submitBtn.addEventListener("click", async () => {
  errorMsg.innerHTML = "";
  errorMsg.style.display = "none";
  submitBtn.disabled = true;
  submitBtn.textContent = "Ingresando...";
  
  try {
    const { error, data } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });
    
    submitBtn.disabled = false;
    submitBtn.textContent = "Ingresar";
    
    if (error) {
      console.error("Login error:", error);
      errorMsg.innerHTML = error.message || "Error al iniciar sesión. Verifica credenciales.";
      errorMsg.style.display = "block";
      return;
    }
    
    if (data.session) {
      console.log("Login exitoso");
      showApp();
    }
  } catch (err) {
    console.error("Auth exception:", err);
    submitBtn.disabled = false;
    submitBtn.textContent = "Ingresar";
    errorMsg.innerHTML = "Error inesperado. Intenta nuevamente.";
    errorMsg.style.display = "block";
  }
});

// Permite iniciar sesión presionando Enter
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitBtn.click();
});

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      showLogin();
      emailInput.value = "";
      passwordInput.value = "";
    });
  }
});

// Verificar sesión al cargar
checkSession();
