const supabaseUrl = 'https://mznvjujrjababgvrprym.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZfcZqv4xmVzoVCZddjeBbQ_gIyoruYY';

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
    console.log('✅ Login:', currentUser.email);
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function logoutUser() {
  try {
    await supabaseClient.auth.signOut();
    currentUser = null;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function checkSession() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      currentUser = data.session.user;
      return true;
    }
    return false;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', checkSession);
