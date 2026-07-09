const cases = [
  {
    id: 1,
    title: "Caso 1",
    question: "¿Qué pasa con este paciente?",
    options: ["Respuesta A", "Respuesta B", "Respuesta C"],
    answer: 1,
    explanation: "Explicación corta del caso 1."
  },
  {
    id: 2,
    title: "Caso 2",
    question: "¿Cuál es la respuesta correcta?",
    options: ["Opción A", "Opción B", "Opción C"],
    answer: 0,
    explanation: "Explicación corta del caso 2."
  }
];

const state = {
  current: 0,
  completed: Number(localStorage.getItem("preSerumCompleted") || 0),
  correct: Number(localStorage.getItem("preSerumCorrect") || 0)
};

function saveState() {
  localStorage.setItem("preSerumCompleted", String(state.completed));
  localStorage.setItem("preSerumCorrect", String(state.correct));
}

function updateStats(ok) {
  state.completed += 1;
  if (ok) state.correct += 1;
  saveState();
}

function getAccuracy() {
  return state.completed ? Math.round((state.correct / state.completed) * 100) : 0;
}

function renderStatsCard() {
  return `
    <div class="stats">
      <div class="stat">
        <span class="label">Casos resueltos</span>
        <span class="value">${state.completed}</span>
      </div>
      <div class="stat">
        <span class="label">Correctas</span>
        <span class="value">${state.correct}</span>
      </div>
      <div class="stat">
        <span class="label">Precisión</span>
        <span class="value">${getAccuracy()}%</span>
      </div>
    </div>
    <div class="footer-note">Tu progreso se guarda en este navegador.</div>
  `;
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function renderCase(c) {
  return `
    <div class="case-card">
      <h2>${safeText(c.title, "Caso")}</h2>
      <p>${safeText(c.question, "Sin pregunta")}</p>
      <div class="options">
        ${c.options.map((opt, i) => `
          <button class="option-btn" id="opt-${i}" onclick="answerCase(${c.id}, ${i})">${opt}</button>
        `).join("")}
      </div>
      <div id="feedback" class="feedback"></div>
    </div>
  `;
}

function renderDashboard() {
  return `
    <div class="cases-grid">
      <div class="case-card">
        <h2>Bienvenido</h2>
        <p>Selecciona un módulo en el panel izquierdo para comenzar.</p>
      </div>
    </div>
  `;
}

function renderCases() {
  const c = cases[state.current];
  return `
    <div class="cases-grid">
      ${renderCase(c)}
    </div>
  `;
}

function renderSimulator() {
  return `
    <div class="cases-grid">
      <div class="case-card">
        <h2>Simulador</h2>
        <p>Espacio para escenarios interactivos y práctica guiada.</p>
      </div>
    </div>
  `;
}

function renderLibrary() {
  return `
    <div class="cases-grid">
      <div class="case-card">
        <h2>Biblioteca Normativa</h2>
        <p>Espacio para enlaces, protocolos y material de consulta.</p>
      </div>
    </div>
  `;
}

function setHeader(title, subtitle) {
  const pageTitle = document.getElementById("page-title");
  const pageSubtitle = document.getElementById("page-subtitle");
  if (pageTitle) pageTitle.textContent = title;
  if (pageSubtitle) pageSubtitle.textContent = subtitle;
}

function renderView(view) {
  const root = document.getElementById("view-root");
  if (!root) return;

  if (view === "dashboard") {
    setHeader("Dashboard", "Resumen general del progreso y acceso a los módulos.");
    root.innerHTML = renderDashboard();
  } else if (view === "cases") {
    setHeader("Módulo de Casos", "Responde los casos y revisa la retroalimentación.");
    root.innerHTML = renderCases();
  } else if (view === "simulator") {
    setHeader("Simulador", "Práctica interactiva para entrenar decisiones.");
    root.innerHTML = renderSimulator();
  } else if (view === "library") {
    setHeader("Biblioteca 
