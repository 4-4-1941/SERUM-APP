// ============================================
// SERUM-APP v2.0 — PLATAFORMA UNIFICADA
// ============================================
// Plataforma integrada para SERUMS Perú con:
// - 529 casos clínicos validados
// - Simulacro de 100 preguntas estratificado
// - 7 módulos de capacitación
// - Screening tools integrados
// - Consultor profesional
// - Base de normas MINSA
// ============================================

const { createClient } = supabase;

// ========== CONFIGURACIÓN ==========
const SUPABASE_URL = "https://xcfdhwqjudzngvlssyeg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZmRod3FqdWR6bmd2bHNzeWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3NjUxMDEsImV4cCI6MTkyNTM0MTEwMX0.zk0pHDhx4aJf-Yw1Q27Wm_V2CzHvMhDKPz8WsD3vJ7I";

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Bloques oficiales SERUMS (5)
const OFFICIAL_BLOCKS = [
  "Gestión",
  "Salud Pública",
  "Cuidado integral",
  "Ética e Interculturalidad",
  "Investigación"
];

// Pesos distribución bloques en examen real
const REAL_EXAM_BLOCK_WEIGHTS = {
  "Gestión": 0.26,
  "Salud Pública": 0.26,
  "Cuidado integral": 0.18,
  "Ética e Interculturalidad": 0.16,
  "Investigación": 0.14
};

// Carreras SERUMS (18)
const SERUMS_CAREERS = [
  "Psicología", "Medicina", "Enfermería", "Transversal",
  "Obstetricia", "Odontología", "Nutrición", "Farmacia y Bioquímica",
  "Trabajo Social", "Tecnología Médica - Laboratorio Clínico",
  "Tecnología Médica - Radiología", "Tecnología Médica - Terapia Física",
  "Tecnología Médica - Terapia del Lenguaje", "Tecnología Médica - Terapia Ocupacional",
  "Tecnología Médica - Optometría", "Medicina Veterinaria",
  "Biología", "Ingeniería Sanitaria"
];

// ========== ESTADO GLOBAL ==========
let currentUser = null;
let simulacroHistory = [];

// ========== DOM ==========
const loginScreen = document.getElementById("login-screen");
const appContainer = document.querySelector(".app");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginForm = document.querySelector(".login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");

// ========== AUTENTICACIÓN ==========
async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = "";
  loginSubmit.disabled = true;
  loginSubmit.textContent = "Ingresando...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: loginEmail.value,
    password: loginPassword.value
  });

  if (error) {
    loginError.textContent = error.message || "Error al ingresar. Verifica credenciales.";
    loginSubmit.disabled = false;
    loginSubmit.textContent = "Ingresar";
    return;
  }

  currentUser = data.user;
  loginScreen.style.display = "none";
  appContainer.style.display = "flex";
  renderView("dashboard");
}

function handleLogout() {
  supabaseClient.auth.signOut().then(() => {
    currentUser = null;
    loginScreen.style.display = "block";
    appContainer.style.display = "none";
    loginForm.reset();
    loginError.textContent = "";
  });
}

loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);

// ========== CARGAR DATA ==========
async function loadCasesFromSupabase() {
  const { data, error } = await supabaseClient.from("cases").select("*");
  if (error) {
    console.error("Error cargando casos:", error);
    return [];
  }
  return data || [];
}

// ========== UTILIDADES ==========
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleCaseOptions(original) {
  const order = original.options.map((_, i) => i);
  const shuffledOrder = shuffle(order);
  const newCorrect = shuffledOrder.indexOf(original.correct);
  return { ...original, options: shuffledOrder.map(i => original.options[i]), correct: newCorrect };
}

function recentlyUsedCaseIds() {
  const recent = simulacroHistory.slice(-2);
  const ids = new Set();
  recent.forEach(r => (r.caseIds || []).forEach(id => ids.add(id)));
  return ids;
}

function orderPoolAvoidingRepeats(pool, usedIds) {
  const fresh = shuffle(pool.filter(c => !usedIds.has(c.id)));
  const repeated = shuffle(pool.filter(c => usedIds.has(c.id)));
  return fresh.concat(repeated);
}

function buildSimulacroQueue(career) {
  const usedIds = recentlyUsedCaseIds();
  const isClinicalBlock = b => b === "Cuidado integral" || !OFFICIAL_BLOCKS.includes(b);
  const matchesCareer = c => !career || c.career === career || c.career === "Transversal";

  const pools = {};
  OFFICIAL_BLOCKS.forEach(b => {
    let cases = data.cases.filter(c => c.block === b);
    if (isClinicalBlock(b)) cases = cases.filter(matchesCareer);
    pools[b] = orderPoolAvoidingRepeats(cases, usedIds);
  });

  const queue = [];
  OFFICIAL_BLOCKS.forEach(b => {
    const weight = REAL_EXAM_BLOCK_WEIGHTS[b];
    const quota = Math.round(100 * weight);
    const available = pools[b].slice(0, quota);
    queue.push(...available);
  });

  return shuffle(queue).slice(0, 100);
}

// ========== VISTAS ==========
function renderView(view) {
  navButtons.forEach(b => b.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-view="${view}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  if (view === "dashboard") renderDashboard();
  if (view === "cases") renderCases();
  if (view === "simulacro") renderSimulacro();
  if (view === "glossary") renderGlossary();
  if (view === "norms") renderNorms();
  if (view === "priorityNorms") renderPriorityNorms();
  if (view === "assistant") renderAssistant();
  if (view === "hisCodesChild") renderHisCodesChild();
  if (view === "training") renderTraining();
  if (view === "screening") renderCapacitacionScreening();
  if (view === "decrees") renderDecrees();
  if (view === "resources") renderResources();
  if (view === "examRegistry") renderExamRegistry();
  if (view === "screeningTools") renderScreeningTools();
}

// ========== DASHBOARD ==========
function renderDashboard() {
  pageTitle.textContent = "Tablero";
  pageSubtitle.textContent = "";
  const scoreBadge = document.getElementById("score-badge");
  const resolvedBadge = document.getElementById("resolved-badge");
  scoreBadge.textContent = `PUNTAJE: 0%`;
  resolvedBadge.textContent = `RESUELTOS: 0/${data.cases.length}`;

  root.innerHTML = `
    <div class="dashboard">
      <div class="cards-row">
        <div class="card">
          <h3 class="card-label">PUNTAJE</h3>
          <p class="card-value">0</p>
        </div>
        <div class="card">
          <h3 class="card-label">CASOS</h3>
          <p class="card-value">${data.cases.length}</p>
        </div>
      </div>
      <div class="cards-row">
        <div class="card">
          <h3 class="card-label">NORMAS</h3>
          <p class="card-value">${data.norms ? data.norms.length : 0}</p>
        </div>
        <div class="card">
          <h3 class="card-label">NORMAS PRIORITARIAS 2026</h3>
          <p class="card-value">${data.priorityNorms ? data.priorityNorms.length : 0}</p>
        </div>
      </div>
      <div class="cards-row">
        <div class="card">
          <h3 class="card-label">DECRETOS</h3>
          <p class="card-value">${data.decrees ? data.decrees.length : 0}</p>
        </div>
      </div>
      <div class="action-card">
        <h3>Repasar ahora →</h3>
        <p>Prioriza casos nunca intentados y con error, comenzando por los más antiguos.</p>
        <button onclick="renderView('cases')" class="btn-primary">Iniciar práctica</button>
      </div>
      <div class="section-title">ENTRENAMIENTO</div>
      <div class="progress-grid">
        <div class="progress-col">
          <h4>Progreso por carrera</h4>
          ${SERUMS_CAREERS.map(c => `
            <div class="progress-item">
              <span>${c}</span>
              <span>0/${data.cases.filter(cs => cs.career === c).length} · 0%</span>
            </div>
          `).join("")}
        </div>
        <div class="progress-col">
          <h4>Progreso por bloque temático</h4>
          ${OFFICIAL_BLOCKS.map(b => `
            <div class="progress-item">
              <span>${b}</span>
              <span>0/${data.cases.filter(cs => cs.block === b).length} · 0%</span>
            </div>
          `).join("")}
        </div>
      </div>
      <div style="margin-top:20px;padding:10px;background:#f0f4f3;border-radius:6px;font-size:13px;color:#5b6e6a">
        <strong>Base de Datos SERUMS — exámenes reales analizados</strong><br>
        Bloques temáticos oficiales SERUMS, con prioridad en Psicología e integración interdisciplinaria de las demás carreras de la salud.
      </div>
    </div>
  `;
}

// ========== CASOS CLÍNICOS ==========
function renderCases() {
  pageTitle.textContent = "Casos clínicos";
  pageSubtitle.textContent = `Base de ${data.cases.length} casos validados`;

  const careerFilter = new Set();
  let filteredCases = data.cases;

  const html = `
    <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">
      <input type="text" id="case-search" placeholder="Buscar por síntoma, diagnóstico..." style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px">
      <select id="career-filter" style="padding:8px;border:1px solid #ccc;border-radius:4px">
        <option value="">Todas las carreras</option>
        ${SERUMS_CAREERS.map(c => `<option value="${c}">${c}</option>`).join("")}
      </select>
    </div>
    <div id="cases-list" style="display:grid;gap:12px"></div>
  `;

  root.innerHTML = html;

  const searchInput = document.getElementById("case-search");
  const careerSelect = document.getElementById("career-filter");
  const casesList = document.getElementById("cases-list");

  function renderList() {
    let result = filteredCases;
    if (careerFilter.size > 0) {
      result = result.filter(c => careerFilter.has(c.career));
    }
    if (searchInput.value.trim()) {
      const q = searchInput.value.toLowerCase();
      result = result.filter(c => 
        c.title?.toLowerCase().includes(q) || 
        c.desc?.toLowerCase().includes(q)
      );
    }
    casesList.innerHTML = result.map(c => `
      <article class="case-card" onclick="openCase(${c.id})">
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
        <small>${c.career} · ${c.block}</small>
      </article>
    `).join("");
  }

  searchInput.addEventListener("input", renderList);
  careerSelect.addEventListener("change", (e) => {
    careerFilter.clear();
    if (e.target.value) careerFilter.add(e.target.value);
    renderList();
  });

  renderList();
}

function openCase(caseId) {
  const caseData = data.cases.find(c => c.id === caseId);
  if (!caseData) return;

  const shuffled = shuffleCaseOptions(caseData);
  pageTitle.textContent = caseData.title;
  pageSubtitle.textContent = `${caseData.career} · ${caseData.block}`;

  root.innerHTML = `
    <div class="case-detail">
      <p>${caseData.desc}</p>
      <div style="margin:20px 0;padding:16px;background:#f9faf9;border-radius:6px">
        <strong>Pregunta:</strong> ${caseData.question}
      </div>
      <div class="options" id="options-list">
        ${shuffled.options.map((opt, i) => `
          <button class="option-btn" data-index="${i}" onclick="checkAnswer(${shuffled.correct}, ${i}, this)">
            ${String.fromCharCode(65 + i)}. ${opt}
          </button>
        `).join("")}
      </div>
      <button onclick="renderView('cases')" class="btn-secondary" style="margin-top:16px">Volver</button>
    </div>
  `;
}

function checkAnswer(correct, selected, btn) {
  const allBtns = document.querySelectorAll(".option-btn");
  allBtns.forEach(b => b.disabled = true);
  
  if (selected === correct) {
    btn.style.backgroundColor = "#27ae60";
    btn.style.color = "white";
  } else {
    btn.style.backgroundColor = "#e74c3c";
    btn.style.color = "white";
    allBtns[correct].style.backgroundColor = "#27ae60";
    allBtns[correct].style.color = "white";
  }
}

// ========== SIMULACRO ==========
function renderSimulacro() {
  pageTitle.textContent = "Simulacro (100)";
  pageSubtitle.textContent = "Examen estratificado basado en pesos reales de SERUMS";

  root.innerHTML = `
    <div style="display:grid;gap:12px">
      <div style="padding:12px;background:#f0f4f3;border-radius:6px">
        <strong>Selecciona carrera:</strong>
        <div id="career-list" style="display:grid;gap:8px;margin-top:12px"></div>
      </div>
    </div>
  `;

  const careerList = document.getElementById("career-list");
  careerList.innerHTML = SERUMS_CAREERS.map(c => `
    <button class="btn-secondary" onclick="startSimulacro('${c}')">
      ${c}
    </button>
  `).join("");

  const transversalBtn = careerList.querySelector("button:last-child");
  if (transversalBtn) {
    transversalBtn.innerHTML = "Transversal (todas las carreras)";
    transversalBtn.setAttribute("onclick", "startSimulacro('Transversal')");
  }
}

function startSimulacro(career) {
  const queue = buildSimulacroQueue(career === "Transversal" ? null : career);
  pageTitle.textContent = `Simulacro (100) · ${career}`;
  pageSubtitle.textContent = "Estratificado según distribución de examen real SERUMS";

  let currentIndex = 0;
  let score = 0;
  let answers = [];

  function showQuestion() {
    if (currentIndex >= queue.length) {
      showResults();
      return;
    }
    const caseData = queue[currentIndex];
    const shuffled = shuffleCaseOptions(caseData);

    root.innerHTML = `
      <div class="simulacro-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${(currentIndex / queue.length) * 100}%"></div>
        </div>
        <p style="text-align:center;color:#5b6e6a">${currentIndex + 1} de ${queue.length}</p>
        <h3>${caseData.question}</h3>
        <div class="options">
          ${shuffled.options.map((opt, i) => `
            <button class="option-btn" onclick="recordAnswer(${currentIndex}, ${shuffled.correct}, ${i}, this)">
              ${String.fromCharCode(65 + i)}. ${opt}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  window.recordAnswer = function(idx, correct, selected, btn) {
    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach(b => b.disabled = true);
    answers[idx] = selected;
    if (selected === correct) {
      score++;
      btn.style.backgroundColor = "#27ae60";
      btn.style.color = "white";
    } else {
      btn.style.backgroundColor = "#e74c3c";
      btn.style.color = "white";
      allBtns[correct].style.backgroundColor = "#27ae60";
      allBtns[correct].style.color = "white";
    }
    setTimeout(() => {
      currentIndex++;
      showQuestion();
    }, 1000);
  };

  window.showResults = function() {
    simulacroHistory.push({ date: new Date(), score, caseIds: queue.map(c => c.id) });
    const percentage = Math.round((score / queue.length) * 100);
    root.innerHTML = `
      <div style="text-align:center;padding:40px">
        <h2>Simulacro completado</h2>
        <p style="font-size:32px;font-weight:bold;color:#1e3c72">${score} / ${queue.length}</p>
        <p style="font-size:20px">${percentage}%</p>
        <button onclick="renderView('simulacro')" class="btn-primary" style="margin-top:20px">Hacer otro simulacro</button>
        <button onclick="renderView('dashboard')" class="btn-secondary" style="margin-top:10px">Ir al tablero</button>
      </div>
    `;
  };

  showQuestion();
}

// ========== GLOSARIO ==========
function renderGlossary() {
  pageTitle.textContent = "Conceptos clave";
  pageSubtitle.textContent = "66 términos clínicos, epidemiológicos y administrativos";

  root.innerHTML = `
    <input type="text" id="glossary-search" placeholder="Buscar término..." style="width:100%;padding:10px;margin-bottom:16px;border:1px solid #ccc;border-radius:4px">
    <div id="glossary-list" style="display:grid;gap:12px"></div>
  `;

  const glossaryData = data.glossary || [];
  const searchInput = document.getElementById("glossary-search");
  const glossaryList = document.getElementById("glossary-list");

  function renderGlossaryList() {
    const q = searchInput.value.toLowerCase();
    const filtered = glossaryData.filter(g => g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q));
    glossaryList.innerHTML = filtered.map(g => `
      <div style="padding:12px;background:#f9faf9;border-radius:6px;border-left:4px solid #1e3c72">
        <h4>${g.term}</h4>
        <p>${g.def}</p>
      </div>
    `).join("");
  }

  searchInput.addEventListener("input", renderGlossaryList);
  renderGlossaryList();
}

// ========== NORMAS ==========
function renderNorms() {
  pageTitle.textContent = "Normativa oficial";
  pageSubtitle.textContent = "4 normas MINSA para SERUMS";

  const norms = data.norms || [];
  root.innerHTML = `
    <div style="display:grid;gap:12px">
      ${norms.map(n => `
        <article class="norm-card">
          <h3>${n.code}</h3>
          <p>${n.title}</p>
          <button class="action-btn" onclick="alert('Descargar: ${n.url}')">Ver documento →</button>
        </article>
      `).join("")}
    </div>
  `;
}

function renderPriorityNorms() {
  pageTitle.textContent = "Normas prioritarias 2026";
  pageSubtitle.textContent = "10 resoluciones claves para SERUMS";

  const norms = data.priorityNorms || [];
  root.innerHTML = `
    <div style="display:grid;gap:12px">
      ${norms.map(n => `
        <article class="norm-card">
          <h3>${n.code}</h3>
          <p>${n.title}</p>
          <small>${n.date}</small>
          <button class="action-btn">Leer →</button>
        </article>
      `).join("")}
    </div>
  `;
}

function renderDecrees() {
  pageTitle.textContent = "Decretos y lineamientos";
  pageSubtitle.textContent = "14 decretos legislativos vigentes";

  const decrees = data.decrees || [];
  root.innerHTML = `
    <div style="display:grid;gap:12px">
      ${decrees.map(d => `
        <article class="norm-card">
          <h3>${d.code}</h3>
          <p>${d.title}</p>
          <button class="action-btn">Descargar →</button>
        </article>
      `).join("")}
    </div>
  `;
}

// ========== ENTRENAMIENTO ==========
function renderTraining() {
  pageTitle.textContent = "Entrenamiento SERUMS";
  pageSubtitle.textContent = "10 escenarios clínicos ramificados";

  root.innerHTML = `
    <div style="display:grid;gap:12px">
      <div class="scenario-card">
        <h3>Escenario 1: Consejería en adicciones</h3>
        <p>Simulación de entrevista motivacional con paciente en fase de precontemplación.</p>
        <button class="btn-primary">Iniciar →</button>
      </div>
      <div class="scenario-card">
        <h3>Escenario 2: Evaluación clínica integral</h3>
        <p>Toma de decisiones en contexto comunitario con recursos limitados.</p>
        <button class="btn-primary">Iniciar →</button>
      </div>
    </div>
  `;
}

// ========== CAPACITACIÓN SCREENING ==========
function renderCapacitacionScreening() {
  pageTitle.textContent = "Capacitación · Screening";
  pageSubtitle.textContent = "Módulos de tamizaje clínico validados para formación de SERUMS.";
  const tools = [
    {
      name: "AUDIT / AUDIT-C",
      badge: "10 ítems · OMS 2001",
      desc: "Identificación de Trastornos por Consumo de Alcohol. Incluye modo de tamizaje rápido AUDIT-C (3 preguntas, con opción de continuar al AUDIT completo si sale positivo). Disponible en español y quechua ayacuchano validado (Douglas Hospital Research Centre / IPAZ).",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/capacitacion/capacitacion.html"
    },
    {
      name: "GAD-7",
      badge: "7 ítems · Spitzer et al., 2006",
      desc: "Escala de Ansiedad Generalizada. Versión en castellano.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/gad7.html"
    },
    {
      name: "PHQ-9",
      badge: "9 ítems · Kroenke, Spitzer & Williams, 2001",
      desc: "Cuestionario de Salud del Paciente para depresión. Corte de cribado preventivo MINSA ≥5 (además del corte internacional ≥10). Incluye alerta clínica en el ítem de ideación suicida/autolesión.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/phq9.html"
    },
    {
      name: "WAST",
      badge: "2 ítems · Brown et al., 1996",
      desc: "Tamizaje corto de violencia de pareja hacia la mujer (Woman Abuse Screening Tool). Versión validada en español (Plazaola-Castaño et al., 2008).",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/wast.html"
    },
    {
      name: "ASSIST",
      badge: "10 sustancias · OMS v3.0",
      desc: "Tamizaje de consumo de alcohol y drogas por sustancia (alcohol, tabaco, marihuana, cocaína y otras). Cortes oficiales OMS 2011, con alerta adicional para adolescentes (RM N.° 753-2021-MINSA).",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/assist.html"
    },
    {
      name: "CRAFFT",
      badge: "6 ítems · Knight, 1999 · v2.1",
      desc: "Tamizaje breve de consumo de alcohol y drogas en adolescentes y jóvenes (10-21 años). Corte oficial: 2 o más respuestas afirmativas = riesgo alto. © Boston Children's Hospital.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/crafft.html"
    },
    {
      name: "TDAH",
      badge: "ASRS-v1.1 · Vanderbilt · SNAP-IV",
      desc: "Tamizaje de TDAH en adultos (ASRS-v1.1, OMS) y niños (Vanderbilt Padres o SNAP-IV 26, a elegir al ingresar).",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/tdah.html"
    },
    {
      name: "Nutrición",
      badge: "Calculadora clínica",
      desc: "IMC, peso ideal (Devine/Robinson/Miller/Hamwi) y gasto energético (Harris-Benedict/Mifflin-St Jeor). Herramienta de apoyo para el profesional.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/nutricion.html"
    },
    {
      name: "SRQ-18",
      badge: "18 ítems · Screening de Salud General",
      desc: "Cuestionario de autorreporte para detección de síntomas ansioso-depresivos en población general. Punto de corte: ≥8 = positivo.",
      url: "screening/srq18.html"
    },
    {
      name: "PSC Pediátrico",
      badge: "30 ítems · Lista de Síntomas Pediátricos",
      desc: "Cribado de disfunción psicosocial infantil (4-16 años), completado por padres/cuidadores. Detecta problemas emocionales, conductuales y sociales.",
      url: "screening/psc-pediatrico.html"
    },
    {
      name: "M-CHAT-R/F",
      badge: "20 ítems · Detección de Riesgo TEA",
      desc: "Cribado de riesgo de Trastorno del Espectro Autista en lactantes 16-30 meses. Puntos de corte: 0-2 (bajo), 3-7 (medio), 8+ (alto/derivación urgente).",
      url: "screening/m-chat-r-f.html"
    },
    {
      name: "GDS-15",
      badge: "15 ítems · Escala de Depresión Geriátrica (Yesavage)",
      desc: "Escala validada para detección de depresión en adultos ≥65 años. Sensible a cambios clínicos. Puntos de corte: 0-4 (sin), 5-8 (leve), 9-15 (moderada-severa).",
      url: "screening/gds15-yesavage.html"
    },
    {
      name: "Quiz Avanzado · Referencia-Contrarreferencia",
      badge: "Simulador clínico",
      desc: "Simulador interactivo de casos clínicos de referencia-contrarreferencia. Toma de decisiones en contexto SERUMS con feedback inmediato.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/simulador/quiz-avanzado-referencia.html"
    },
    {
      name: "Quiz Etapa Niño",
      badge: "Simulador pediatría",
      desc: "Evaluación de competencias en pediatría básica. Casos clínicos pediátricos con criterios de evaluación SERUMS.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/simulador/quiz-etapa-nino.html"
    }
  ];
  root.innerHTML = `
    <div class="norm-list">
      ${tools.map(t => `
        <article class="norm-card">
          <span>${t.badge}</span>
          <h3>${t.name}</h3>
          <p>${t.desc}</p>
          <button class="action-btn" data-url="${t.url}" style="margin-top:10px">Abrir ${t.name} →</button>
        </article>
      `).join("")}
    </div>
    <p style="margin-top:16px;color:#5B6E6A;font-size:13px">Cada aplicación queda registrada con datos demográficos anonimizados en la base de datos SERUMS.</p>
  `;
  root.querySelectorAll("[data-url]").forEach(btn => {
    btn.addEventListener("click", () => window.open(btn.dataset.url, "_blank"));
  });
}

// ========== CLINICAL SCREENING TOOLS ==========
function renderScreeningTools() {
  pageTitle.textContent = "Clinical Screening Toolkit";
  pageSubtitle.textContent = "Instrumentos de tamizaje clínico validados, con registro automático del caso para investigación epidemiológica.";
  const tools = [
    {
      name: "AUDIT / AUDIT-C",
      badge: "10 ítems · OMS 2001",
      desc: "Identificación de Trastornos por Consumo de Alcohol. Incluye modo de tamizaje rápido AUDIT-C (3 preguntas, con opción de continuar al AUDIT completo si sale positivo). Disponible en español y quechua ayacuchano validado (Douglas Hospital Research Centre / IPAZ).",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/capacitacion/capacitacion.html"
    },
    {
      name: "GAD-7",
      badge: "7 ítems · Spitzer et al., 2006",
      desc: "Escala de Ansiedad Generalizada. Versión en castellano.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/gad7.html"
    },
    {
      name: "PHQ-9",
      badge: "9 ítems · Kroenke, Spitzer & Williams, 2001",
      desc: "Cuestionario de Salud del Paciente para depresión. Corte de cribado preventivo MINSA ≥5 (además del corte internacional ≥10). Incluye alerta clínica en el ítem de ideación suicida/autolesión.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/phq9.html"
    },
    {
      name: "WAST",
      badge: "2 ítems · Brown et al., 1996",
      desc: "Tamizaje corto de violencia de pareja hacia la mujer (Woman Abuse Screening Tool). Versión validada en español (Plazaola-Castaño et al., 2008).",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/wast.html"
    },
    {
      name: "ASSIST",
      badge: "10 sustancias · OMS v3.0",
      desc: "Tamizaje de consumo de alcohol y drogas por sustancia (alcohol, tabaco, marihuana, cocaína y otras). Cortes oficiales OMS 2011, con alerta adicional para adolescentes (RM N.° 753-2021-MINSA).",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/assist.html"
    },
    {
      name: "CRAFFT",
      badge: "6 ítems · Knight, 1999 · v2.1",
      desc: "Tamizaje breve de consumo de alcohol y drogas en adolescentes y jóvenes (10-21 años). Corte oficial: 2 o más respuestas afirmativas = riesgo alto. © Boston Children's Hospital.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/crafft.html"
    },
    {
      name: "TDAH",
      badge: "ASRS-v1.1 · Vanderbilt · SNAP-IV",
      desc: "Tamizaje de TDAH en adultos (ASRS-v1.1, OMS) y niños (Vanderbilt Padres o SNAP-IV 26, a elegir al ingresar).",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/tdah.html"
    },
    {
      name: "Nutrición",
      badge: "Calculadora clínica",
      desc: "IMC, peso ideal (Devine/Robinson/Miller/Hamwi) y gasto energético (Harris-Benedict/Mifflin-St Jeor). Herramienta de apoyo para el profesional.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/screening/nutricion.html"
    },
    {
      name: "SRQ-18",
      badge: "18 ítems · Screening de Salud General",
      desc: "Cuestionario de autorreporte para detección de síntomas ansioso-depresivos en población general. Punto de corte: ≥8 = positivo.",
      url: "screening/srq18.html"
    },
    {
      name: "PSC Pediátrico",
      badge: "30 ítems · Lista de Síntomas Pediátricos",
      desc: "Cribado de disfunción psicosocial infantil (4-16 años), completado por padres/cuidadores. Detecta problemas emocionales, conductuales y sociales.",
      url: "screening/psc-pediatrico.html"
    },
    {
      name: "M-CHAT-R/F",
      badge: "20 ítems · Detección de Riesgo TEA",
      desc: "Cribado de riesgo de Trastorno del Espectro Autista en lactantes 16-30 meses. Puntos de corte: 0-2 (bajo), 3-7 (medio), 8+ (alto/derivación urgente).",
      url: "screening/m-chat-r-f.html"
    },
    {
      name: "GDS-15",
      badge: "15 ítems · Escala de Depresión Geriátrica (Yesavage)",
      desc: "Escala validada para detección de depresión en adultos ≥65 años. Sensible a cambios clínicos. Puntos de corte: 0-4 (sin), 5-8 (leve), 9-15 (moderada-severa).",
      url: "screening/gds15-yesavage.html"
    },
    {
      name: "Quiz Avanzado · Referencia-Contrarreferencia",
      badge: "Simulador clínico",
      desc: "Simulador interactivo de casos clínicos de referencia-contrarreferencia. Toma de decisiones en contexto SERUMS con feedback inmediato.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/simulador/quiz-avanzado-referencia.html"
    },
    {
      name: "Quiz Etapa Niño",
      badge: "Simulador pediatría",
      desc: "Evaluación de competencias en pediatría básica. Casos clínicos pediátricos con criterios de evaluación SERUMS.",
      url: "https://4-4-1941.github.io/SCREENING-TOOLS-SERUMS-PER--SIP/simulador/quiz-etapa-nino.html"
    }
  ];
  root.innerHTML = `
    <div class="norm-list">
      ${tools.map(t => `
        <article class="norm-card">
          <span>${t.badge}</span>
          <h3>${t.name}</h3>
          <p>${t.desc}</p>
          <button class="action-btn" data-url="${t.url}" style="margin-top:10px">Abrir ${t.name} →</button>
        </article>
      `).join("")}
    </div>
    <p style="margin-top:16px;color:#5B6E6A;font-size:13px">Cada aplicación queda registrada con datos demográficos anonimizados (sexo, edad, estado civil, departamento) en la base de datos SERUMS.</p>
  `;
  root.querySelectorAll("[data-url]").forEach(btn => {
    btn.addEventListener("click", () => window.open(btn.dataset.url, "_blank"));
  });
}

// ========== HIS CODES CHILD ==========
function renderHisCodesChild() {
  pageTitle.textContent = "Códigos HIS — Niño";
  pageSubtitle.textContent = "173 códigos CIE10 / CPMS para atención pediátrica";

  root.innerHTML = `
    <input type="text" id="his-search" placeholder="Buscar código o diagnóstico..." style="width:100%;padding:10px;margin-bottom:16px;border:1px solid #ccc;border-radius:4px">
    <div id="his-list" style="display:grid;gap:8px"></div>
  `;

  const hisCodes = data.hisCodigosNino || [];
  const searchInput = document.getElementById("his-search");
  const hisList = document.getElementById("his-list");

  function renderHisList() {
    const q = searchInput.value.toLowerCase();
    const filtered = hisCodes.filter(h => h.code.toLowerCase().includes(q) || h.desc.toLowerCase().includes(q));
    hisList.innerHTML = filtered.map(h => `
      <div style="padding:8px;background:#f9faf9;border-radius:4px;font-size:13px;border-left:3px solid #1e3c72">
        <strong>${h.code}</strong> — ${h.desc}
      </div>
    `).join("");
  }

  searchInput.addEventListener("input", renderHisList);
  renderHisList();
}

// ========== ASSISTANT ==========
function renderAssistant() {
  pageTitle.textContent = "Asistente profesional";
  pageSubtitle.textContent = "Consultor con acceso a normas MINSA y criterios diagnósticos";

  root.innerHTML = `
    <div style="padding:16px;background:#f0f4f3;border-radius:6px;margin-bottom:16px">
      <p><strong>Asesoría clínica:</strong> Ingresa síntomas, diagnóstico diferencial o criterios para recibir consulta basada en normas MINSA y evidencia.</p>
    </div>
    <textarea id="assistant-input" placeholder="Describe el caso clínico..." style="width:100%;height:100px;padding:10px;border:1px solid #ccc;border-radius:4px;margin-bottom:10px"></textarea>
    <button id="assistant-submit" class="btn-primary">Enviar consulta</button>
    <div id="assistant-output" style="margin-top:20px"></div>
  `;

  document.getElementById("assistant-submit").addEventListener("click", () => {
    alert("Funcionalidad integrada con API Claude (próxima fase)");
  });
}

// ========== RECURSOS ==========
function renderResources() {
  pageTitle.textContent = "Recursos";
  pageSubtitle.textContent = "";

  root.innerHTML = `
    <div style="display:grid;gap:12px">
      <div class="scenario-card">
        <h3>Documentación SERUMS</h3>
        <p>Acceso a documentos oficiales, cronogramas y normativa.</p>
        <button class="btn-secondary">Descargar →</button>
      </div>
      <div class="scenario-card">
        <h3>Bibliografía de referencia</h3>
        <p>Artículos, guías clínicas y literatura actualizada.</p>
        <button class="btn-secondary">Consultar →</button>
      </div>
    </div>
  `;
}

// ========== EXAM REGISTRY ==========
function renderExamRegistry() {
  pageTitle.textContent = "Registro de exámenes";
  pageSubtitle.textContent = "";

  root.innerHTML = `
    <div style="padding:16px;background:#f9faf9;border-radius:6px">
      <p>Historial vacío. Completa simulacros para registrar intentos.</p>
    </div>
  `;
}

// ========== INICIALIZACIÓN ==========
window.addEventListener("DOMContentLoaded", async () => {
  const session = await supabaseClient.auth.getSession();
  if (session.data.session) {
    currentUser = session.data.session.user;
    loginScreen.style.display = "none";
    appContainer.style.display = "flex";
    renderView("dashboard");
  }
});
