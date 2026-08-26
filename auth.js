// Autenticación Supabase - SERUM-APP-PROD
const SUPABASE_URL = "https://mznvjujrjababgvrprym.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZfcZqv4xmVzoVCZddjeBbQ_gIyoruYY";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar sesión al cargar
async function checkSession() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      currentUser = data.session.user;
      showApp();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    showLogin();
  }
}

// Login
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Ingresa email y contraseña");
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Error de autenticación: " + error.message);
      return;
    }

    currentUser = data.user;
    showApp();
  } catch (error) {
    console.error("Error login:", error);
    alert("Error: " + error.message);
  }
}

// Logout
async function logout() {
  try {
    await supabaseClient.auth.signOut();
    currentUser = null;
    showLogin();
  } catch (error) {
    console.error("Error logout:", error);
  }
}

// Cargar casos desde Supabase
async function loadCasesFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from("banco_preguntas")
      .select("*");

    if (error) {
      console.error("Error cargando casos:", error);
      return null;
    }

    return data || [];
  } catch (error) {
    console.error("Error en loadCasesFromSupabase:", error);
    return null;
  }
}

// Guardar resultado de simulacro
async function saveSimulacroResult(result) {
  try {
    // Opcional: guardar en tabla de resultados
    // const { error } = await supabaseClient
    //   .from("simulacro_results")
    //   .insert([result]);
    
    console.log("Resultado simulacro guardado localmente:", result);
  } catch (error) {
    console.error("Error guardando resultado:", error);
  }
}
