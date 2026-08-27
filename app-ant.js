// ========== SERUM-APP v2.0 - MAIN APPLICATION ==========

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginSubmit = document.getElementById('login-submit');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

const root = document.getElementById('view-root');
const navButtons = document.querySelectorAll('.nav-btn');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const scoreBadge = document.getElementById('score-badge');
const resolvedBadge = document.getElementById('resolved-badge');

const data = window.SERUMS_DATA;

let score = Number(localStorage.getItem(data.scoreKey) || 0);
let caseState = loadProgress(data.caseStateKey, {});
let notes = localStorage.getItem(data.notesKey) || '';
let timerId = null;
let timeLeft = 60;
let activeCase = null;
let currentList = [];
let selectedOption = null;
let confirmed = false;
let priorityReviewMode = false;

// Simulacro
const OFFICIAL_BLOCKS = ['Salud pública', 'Cuidado integral', 'Ética e interculturalidad', 'Investigación', 'Gestión'];
const SIMULACRO_TARGET = 100;
const SIMULACRO_SECONDS_PER_Q = 60;

const REAL_EXAM_BLOCK_WEIGHTS = {
  'Gestión': 0.26,
  'Salud pública': 0.26,
  'Ética e interculturalidad': 0.16,
  'Cuidado integral': 0.18,
  'Investigación': 0.14
};

let simulacroQueue = [];
let simulacroIndex = 0;
let simulacroResults = [];
let simulacroSelected = null;
let simulacroConfirmed = false;
let simulacroTimerId = null;
let simulacroTimeLeft = 0;
let simulacroPhase = 'intro';
let simulacroHistory = loadProgress('simulacroHistory', []);
let simulacroCareer = localStorage.getItem('simulacroCareer') || '';

// ========== LOGIN HANDLER ==========
async function initializeApp() {
  const hasSession = await checkSession();
  
  if (hasSession) {
    // Sesión activa: ocultar login, mostrar app
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainScreen) mainScreen.style.display = 'grid';
    initializeMainApp();
  } else {
    // Sin sesión: mostrar login
    if (loginScreen) loginScreen.style.display = 'flex';
    if (mainScreen) mainScreen.style.display = 'none';
  }
}

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
      initializeMainApp();
    } else {
      loginError.textContent = 'Correo o contraseña incorrectos';
    }
    
    loginSubmit.disabled = false;
    loginSubmit.textContent = 'Ingresar';
  });
}

// ========== MAIN APP INITIALIZATION ==========
function initializeMainApp() {
  console.log('✅ App initialized');
  updateBadges();
  navButtons.forEach((btn) => {
    btn.addEventListener('click', handleNavClick);
  });
  showHome();
}

function handleNavClick(e) {
  const view = e.target.dataset.view;
  navButtons.forEach((btn) => btn.classList.remove('active'));
  e.target.classList.add('active');
  
  switch (view) {
    case 'home':
      showHome();
      break;
    case 'casos':
      showCasos();
      break;
    case 'buscar':
      showSearch();
      break;
    case 'simulacro':
      showSimulacro();
      break;
    case 'notas':
      showNotas();
      break;
  }
}

// ========== HELPER FUNCTIONS ==========
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadProgress(key, defaultValue) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
}

function saveProgress(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateBadges() {
  if (scoreBadge) scoreBadge.textContent = score;
  if (resolvedBadge) resolvedBadge.textContent = Object.keys(caseState).length;
}

// ========== VIEW FUNCTIONS ==========
function showHome() {
  pageTitle.textContent = 'Inicio';
  pageSubtitle.textContent = 'Bienvenido a SERUMS SIP';
  
  root.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h2>SERUMS SIP</h2>
      <p>Casos clínicos: ${data.cases.length}</p>
      <p>Puntaje actual: ${score}</p>
      <p>Casos resueltos: ${Object.keys(caseState).length}</p>
    </div>
  `;
}

function showCasos() {
  pageTitle.textContent = 'Casos';
  pageSubtitle.textContent = 'Explorar casos clínicos';
  root.innerHTML = '<p>Cargando casos...</p>';
}

function showSearch() {
  pageTitle.textContent = 'Buscar';
  pageSubtitle.textContent = 'Busca por palabra clave';
  
  const searchHtml = `
    <div style="padding: 20px;">
      <input type="text" id="search-input" placeholder="Buscar..." style="width: 100%; padding: 10px;">
      <div id="search-results" style="margin-top: 20px;"></div>
    </div>
  `;
  
  root.innerHTML = searchHtml;
  
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }
    
    const results = data.cases.filter((c) => 
      c.title.toLowerCase().includes(query) ||
      c.statement.toLowerCase().includes(query)
    );
    
    searchResults.innerHTML = results.length > 0 
      ? `<p>Encontrados: ${results.length}</p>`
      : '<p>Sin resultados</p>';
  });
}

function showSimulacro() {
  pageTitle.textContent = 'Simulacro';
  pageSubtitle.textContent = '100 preguntas aleatorias';
  root.innerHTML = '<p>Simulacro (proximamente)</p>';
}

function showNotas() {
  pageTitle.textContent = 'Notas';
  pageSubtitle.textContent = 'Mis notas personales';
  root.innerHTML = '<p>Notas (proximamente)</p>';
}

// ========== INITIALIZE ON DOM READY ==========
document.addEventListener('DOMContentLoaded', initializeApp);
