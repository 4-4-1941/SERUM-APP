const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

if (!root || !pageTitle || !pageSubtitle) throw new Error("HTML base incorrecto");

let timerId = null;
let timeLeft = 60;
let score = Number(localStorage.getItem("preSerumScore") || 0);

const cases = [
  {
    id: 1,
    title: "Riesgo suicida en adolescente",
    level: "I-2",
    specialty: "Psicología",
    tags: ["salud mental", "crisis", "derivación"],
    statement: "Adolescente de 16 años llega al establecimiento I-2 con ideación suicida, aislamiento, antecedente de violencia familiar y soporte limitado.",
    question: "¿Cuál es la conducta más adecuada?",
    options: [
      "Dar consejería breve y citar en una semana.",
      "Intervenir en crisis, estabilizar y derivar urgentemente.",
      "Indicar reposo y observación domiciliaria."
    ],
    correct: 1,
    feedback: "Intervenir en crisis, estabilizar y derivar."
  },
  {
    id: 2,
    title: "Violencia familiar con ansiedad",
    level: "I-2",
    specialty: "Psicología",
    tags: ["violencia", "ansiedad", "tamizaje"],
    statement: "Mujer adulta consulta por insomnio, ansiedad y dolor somático. Refiere episodios de violencia familiar y temor al regresar a casa.",
    question: "¿Qué acción corresponde primero?",
    options: [
      "Tamizar riesgo, brindar soporte inicial y derivar según norma.",
      "Solo prescribir descanso y control posterior.",
      "Ignorar el antecedente."
    ],
    correct: 0,
    feedback: "Primero se debe tamizar, brindar soporte inicial y derivar."
  },
  {
    id: 3,
    title: "Paciente con crisis de angustia",
    level: "I-1",
    specialty: "Psicología",
    tags: ["ansiedad", "contención", "primer nivel"],
    statement: "Paciente adulto llega con disnea subjetiva, palpitaciones y miedo intenso; no presenta signos de descompensación orgánica.",
    question: "¿Qué intervención inicial corresponde?",
    options: [
      "Contención emocional, evaluación breve y educación.",
      "Derivación inmediata a cirugía.",
      "Suspender la entrevista y esperar en silencio."
    ],
    correct: 0,
    feedback: "La intervención inicial es contención emocional, evaluación breve y educación."
  },
  {
    id: 4,
    title: "Seguimiento de depresión leve",
    level: "I-1",
    specialty: "Psicología",
    tags: ["depresión", "seguimiento", "psicoeducación"],
    statement: "Paciente con depresión leve controlada, sin ideación suicida, solicita seguimiento y apoyo emocional.",
    question: "¿Cuál es la acción más adecuada?",
    options: [
      "Brindar seguimiento, psicoeducación y reforzar soporte.",
      "Dar de alta sin indicaciones.",
      "Indicar suspensión de toda actividad."
    ],
    correct: 0,
    feedback: "Corresponde seguimiento, psicoeducación y refuerzo del soporte."
  },
  {
    id: 5,
    title: "Tamizaje de violencia",
    level: "I-2",
    specialty: "Psicología",
    tags: ["violencia", "tamizaje", "riesgo"],
    statement: "Persona adulta refiere temor, lesiones antiguas y control coercitivo por parte de su pareja.",
    question: "¿Qué debe hacerse primero?",
    options: [
      "Tamizar riesgo y activar ruta de atención.",
      "Solo escuchar sin registrar datos.",
      "Recomendar no volver al establecimiento."
    ],
    correct: 0,
    feedback: "Primero se debe tamizar el riesgo y activar la ruta de atención."
  }
];
const state = {
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
    <div class="panel">
      <h3>Estado general</h3>
      <p>Casos resueltos: <strong>${state.completed}</strong></p>
      <p>Respuestas correctas: <strong>${state.correct}</strong></p>
      <p>Precisión: <strong>${getAccuracy()}%</strong></p>
    </div>
  `;
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}
const state = {
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
    <div class="panel">
      <h3>Estado general</h3>
      <p>Casos resueltos: <strong>${state.completed}</strong></p>
      <p>Respuestas correctas: <strong>${state.correct}</strong></p>
      <p>Precisión: <strong>${getAccuracy()}%</strong></p>
    </div>
  `;
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
    }
function setActive(view) {
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
}

function saveScore() {
  localStorage.setItem("preSerumScore", String(score));
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function startTimer() {
  stopTimer();
  timeLeft = 60;
  const timerLabel = document.getElementById("timer-label");
  if (timerLabel) timerLabel.textContent = formatTime(timeLeft);
  timerId = setInterval(() => {
    timeLeft -= 1;
    const label = document.getElementById("timer-label");
    if (label) label.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) stopTimer();
  }, 1000);
}

function renderCaseCard(c) {
  return `
    <button class="case-card" data-case="${c.id}" data-search="${(c.title + " " + c.tags.join(" ") + " " + c.level + " " + c.specialty).toLowerCase()}">
      <strong>${c.title}</strong>
      <span>${c.level} · ${c.specialty}</span>
      <small>${c.statement}</small>
    </button>
  `;
}

function renderDashboard() {
  pageTitle.textContent = "Dashboard";
  pageSubtitle.textContent = "Resumen general";

  root.innerHTML = `
    <div class="panel">
      <h3>Buscar casos</h3>
      <input id="case-search" class="search" type="text" placeholder="Escribe un tema" />
    </div>

    ${renderStatsCard()}

    <div class="grid metrics">
      ${appData.dashboard.metrics.map(m => `
        <div class="card">
          <span class="label">${safeText(m.label, "Sin etiqueta")}</span>
          <strong class="value">${safeText(String(m.value), "0")}</strong>
        </div>
      `).join("")}
    </div>

    <h3>Progreso</h3>
    <div class="progress-list">
      ${appData.dashboard.progress.map(p => `
        <div>
          <div class="progress-head"><span>${safeText(p.label, "Bloque")}</span><span>${safeText(String(p.value), "0")}%</span></div>
          <div class="bar"><span style="width:${Number(p.value) || 0}%"></span></div>
        </div>
      `).join("")}
    </div>

    <h3>Casos sugeridos</h3>
    <div class="grid cases">
      ${cases.map(c => renderCaseCard(c)).join("")}
    </div>
  `;

  document.querySelectorAll(".case-card").forEach(btn => {
    btn.addEventListener("click", () => renderCase(Number(btn.dataset.case)));
  });

  const search = document.getElementById("case-search");
  if (search) {
    search.addEventListener("input", e => {
      const text = e.target.value.toLowerCase().trim();
      document.querySelectorAll(".case-card").forEach(card => {
        card.style.display = card.dataset.search.includes(text) ? "flex" : "none";
      });
    });
  }
}
function renderCase(id) {
  const c = cases.find(x => x.id === id);
  if (!c) {
    root.innerHTML = `
      <div class="panel error">
        <h3>Caso no encontrado</h3>
        <p>El caso solicitado no existe en la lista actual.</p>
      </div>
    `;
    return;
  }

  pageTitle.textContent = safeText(c.title, "Caso");
  pageSubtitle.textContent = `${safeText(c.level, "Nivel")} · ${safeText(c.specialty, "Área")}`;

  root.innerHTML = `
    <div class="panel">
      <h3>Etiquetas</h3>
      <div class="chips">
        ${(Array.isArray(c.tags) ? c.tags : []).map(t => `<span class="chip">${safeText(t, "tag")}</span>`).join("")}
      </div>
    </div>

    <div class="panel">
      <h3>Enunciado</h3>
      <p>${safeText(c.statement, "Sin enunciado")}</p>
    </div>

    <div class="panel">
      <h3>${safeText(c.question, "Pregunta")}</h3>
      <div class="option-list">
        ${(Array.isArray(c.options) ? c.options : []).map((opt, idx) => `<button class="option-btn" data-opt="${idx}">${safeText(opt, "Opción")}</button>`).join("")}
      </div>
    </div>

    <div id="feedback-zone"></div>

    <div class="panel">
      <button id="back-dashboard" class="action-btn secondary">Volver</button>
    </div>
  `;

  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const picked = Number(btn.dataset.opt);
      const ok = picked === Number(c.correct);

      updateStats(ok);

      document.getElementById("feedback-zone").innerHTML = `
        <div class="panel ${ok ? "success" : "error"}">
          <h3>${ok ? "Correcto" : "Incorrecto"}</h3>
          <p>${safeText(c.feedback, "Sin retroalimentación")}</p>
          <p><strong>Completados:</strong> ${state.completed}</p>
          <p><strong>Correctos:</strong> ${state.correct}</p>
          <p><strong>Precisión:</strong> ${getAccuracy()}%</p>
        </div>
      `;

      document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
    });
  });

  const back = document.getElementById("back-dashboard");
  if (back) back.addEventListener("click", renderDashboard);
}
function renderSimulator() {
  pageTitle.textContent = "Simulador";
  pageSubtitle.textContent = "Cronómetro y práctica";

  root.innerHTML = `
    <div class="panel timer-panel">
      <p>Tiempo restante: <strong id="timer-label">01:00</strong></p>
      <p>Puntaje: <strong>${score}</strong></p>
      <button id="start-timer" class="action-btn">Iniciar</button>
      <button id="stop-timer" class="action-btn secondary">Detener</button>
    </div>

    <div class="panel">
      <h3>Resumen rápido</h3>
      <p>Casos resueltos: <strong>${state.completed}</strong></p>
      <p>Respuestas correctas: <strong>${state.correct}</strong></p>
      <p>Precisión: <strong>${getAccuracy()}%</strong></p>
    </div>
  `;

  const startBtn = document.getElementById("start-timer");
  const stopBtn = document.getElementById("stop-timer");

  if (startBtn) startBtn.addEventListener("click", startTimer);
  if (stopBtn) stopBtn.addEventListener("click", stopTimer);
}
function renderLibrary() {
  pageTitle.textContent = "Biblioteca";
  pageSubtitle.textContent = "Normativa";

  root.innerHTML = `
    <div class="panel">
      <ul>
        ${appData.norms.map(n => `<li>${safeText(n, "Norma")}</li>`).join("")}
      </ul>
    </div>

    <div class="panel">
      <h3>Progreso guardado</h3>
      <p>Casos resueltos: <strong>${state.completed}</strong></p>
      <p>Correctos: <strong>${state.correct}</strong></p>
      <p>Precisión: <strong>${getAccuracy()}%</strong></p>
    </div>
  `;
}

function renderView(view) {
  stopTimer();
  setActive(view);
  if (view === "dashboard") renderDashboard();
  if (view === "cases") renderDashboard();
  if (view === "simulator") renderSimulator();
  if (view === "library") renderLibrary();
}

navButtons.forEach(btn => btn.addEventListener("click", () => renderView(btn.dataset.view)));
renderDashboard();
function resetProgress() {
  state.completed = 0;
  state.correct = 0;
  saveState();
  renderDashboard();
}
