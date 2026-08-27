// SERUM-APP v2.0 - Supabase Auth
// SERUM-APP-PROD Project (mznvjujrjababgvrprym)

const supabaseUrl = 'https://mznvjujrjababgvrprym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bnZ1anJqYWJhYmdycnByeW0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyNDc4NDI4OCwiZXhwIjoxNzI0Nzg3ODg4fQ.ZfcZqv4xmVzoVCZddjeBbQ_gIyoruYY';

const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

let currentUser = null;

async function loginUser(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    currentUser = data.user;
    console.log('✅ Login exitoso:', currentUser.email);
    return true;
  } catch (err) {
    console.error('❌ Error de login:', err.message);
    return false;
  }
}

async function logoutUser() {
  try {
    await supabaseClient.auth.signOut();
    currentUser = null;
    console.log('✅ Sesión cerrada');
  } catch (err) {
    console.error('❌ Error al cerrar sesión:', err.message);
  }
}

async function checkSession() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      currentUser = data.session.user;
      console.log('✅ Sesión activa:', currentUser.email);
      return true;
    }
    return false;
  } catch (err) {
    console.error('❌ Error verificando sesión:', err.message);
    return false;
  }
}

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', checkSession);
