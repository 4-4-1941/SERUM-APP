document.addEventListener('DOMContentLoaded', async () => {
  const loginScreen = document.getElementById('login-screen');
  const mainScreen = document.getElementById('main-screen');
  const loginSubmit = document.getElementById('login-submit');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');

  // Verificar sesión al cargar
  const hasSession = await checkSession();
  if (hasSession && mainScreen) {
    loginScreen.style.display = 'none';
    mainScreen.style.display = 'grid';
  }

  // Manejar login
  if (loginSubmit) {
    loginSubmit.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = loginEmail.value.trim();
      const password = loginPassword.value.trim();

      if (!email || !password) {
        loginError.textContent = 'Correo y contraseña requeridos';
        return;
      }

      loginSubmit.disabled = true;
      loginSubmit.textContent = 'Ingresando...';

      const success = await loginUser(email, password);
      if (success) {
        loginScreen.style.display = 'none';
        mainScreen.style.display = 'grid';
        loginEmail.value = '';
        loginPassword.value = '';
        loginError.textContent = '';
      } else {
        loginError.textContent = 'Correo o contraseña incorrectos';
      }

      loginSubmit.disabled = false;
      loginSubmit.textContent = 'Ingresar';
    });
  }
});
