const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

let timerId = null;
let timeLeft = 60;
let score = 0;
let currentCaseIndex = 0;

const interactiveCases = [
  {
    id: 1,
    title: "Riesgo suicida en adolescente",
    level: "I-2",
    specialty: "Psicología",
    statement: "Adolescente de 16 años llega al establecimiento I-2 con ideación suicida, aislamiento, antecedente de violencia familiar y soporte limitado.",
    question: "¿Cuál es la conducta más adecuada?",
    options: [
      "Dar consejería breve y citar en una semana.",
      "Intervenir en crisis, estabilizar y derivar urgentemente.",
      "Indicar reposo y observación domiciliaria."
    ],
    correct: 1,
    feedback: "La conducta correcta es intervenir en crisis, estabilizar y derivar con urgencia por riesgo alto."
  },
  {
    id: 2,
    title: "Violencia familiar con ansiedad",
    level: "I-2",
    specialty: "Psicología",
    statement: "Mujer adulta consulta por insomnio, ansiedad y dolor somático. Refiere episodios de violencia familiar y temor al regresar a casa.",
    question: "¿Qué acción corresponde primero?",
    options: [
      "Tamizar riesgo, brindar soporte inicial y derivar según norma.",
      "Solo prescribir descanso y control posterior.",
      "Ignorar el antecedente para evitar revictimización."
    ],
    correct: 0,
    feedback: "Primero se debe tamizar, brindar soporte inicial y definir derivación según el nivel de riesgo."
  }
];

function setActive(view) {
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
}

function renderDashboard() {
  pageTitle.textContent = "Dashboard";
  pageSubtitle.textContent = "Resumen general del progreso y acceso a los módulos.";

  root.innerHTML = `
    <div class="grid metrics">
      ${appData.dashboard.metrics.map(m => `
        <div class="card">
          <span class="label">${m.label}</span>
          <strong class="value">${m.value}</strong>
        </div>
      `).join("")}
    </div>

    <h3>Progreso por bloque</h3>
    <div class="progress-list">
      ${appData.dashboard.progress.map(p => `
        <div class="progress-item">
          <div class="progress-head">
            <span>${p.label}</span>
            <span>${p.value}%</span>
          </div>
          <div class="bar"><span style="width:${p.value}%"></span></div>
        </div>
      `).join("")}
    </div>

    <h3>Casos sugeridos</h3>
    <div class="grid cases">
      ${interactiveCases.map(c => `
        <button class="case-card" data-case="${c.id}">
          <strong>${c.title}</strong>
          <span>${c.level} · ${c.specialty}</span>
          <small>${c.statement}</small>
        </button>
      `).join("")}
    </div>
  `;

  document.querySelectorAll(".case-card").forEach(btn => {
    btn.addEventListener("click", () => renderCase(Number(btn.dataset.case)));
  });
}

function renderCase(id) {
  const c = interactiveCases.find(x => x.id === id);
  currentCaseIndex = interactiveCases.findIndex(x => x.id === id);
  pageTitle.textContent = c.title;
  pageSubtitle.textContent = `${c.level} · ${c.specialty} · Caso interactivo`;

  root.innerHTML = `
    <div class="panel">
      <h3>Enunciado</h3>
      <p>${c.statement}</p>
    </div>

    <div class="panel">
      <h3>${c.question}</h3>
      <div class="option-list">
        ${c.options.map((opt, idx) => `
          <button class="option-btn" data-opt="${idx}">${opt}</button>
        `).join("")}
      </div>
    </div>

    <div id="case-feedback"></div>

    <div class="panel">
      <button id="next-case" class="action-btn">Siguiente caso</button>
    </div>
  `;

  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const picked = Number(btn.dataset.opt);
      const correct = picked === c.correct;
      if (correct) score += 1;

      document.getElementById("case-feedback").innerHTML = `
        <div class="panel ${correct ? "success" : "error"}">
          <h3>${correct ? "Correcto" : "Incorrecto"}</h3>
          <p>${c.feedback}</p>
          <p><strong>Puntaje actual:</strong> ${score}/${interactiveCases.length}</p>
        </div>
      `;

      document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
    });
  });

  document.getElementById("next-case").addEventListener("click", () => {
    const nextIndex = (currentCaseIndex + 1) % interactiveCases.length;
    renderCase(interactiveCases[nextIndex].id);
  });
}

function renderSimulator() {
  pageTitle.textContent = "Simulador";
  pageSubtitle.textContent = "Modo cronometrado y preguntas largas.";

  root.innerHTML = `
    <div class="panel">
      <h3>Simulador cronometrado</h3>
      <p>Tiempo restante: <strong id="timer-label">${formatTime(timeLeft)}</strong></p>
      <button id="start-timer" class="action-btn">Iniciar cronómetro</button>
      <button id="stop-timer" class="action-btn secondary">Detener</button>
    </div>
  `;

  document.getElementById("start-timer").addEventListener("click", startTimer);
  document.getElementById("stop-timer").addEventListener("click", stopTimer);
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function startTimer() {
  stopTimer();
  timeLeft = 60;
  timerId = setInterval(() => {
    timeLeft -= 1;
    const timerLabel = document.getElementById("timer-label");
    if (timerLabel) timerLabel.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      stopTimer();
      const panel = document.querySelector(".panel");
      if (panel) panel.insertAdjacentHTML("beforeend", `<p><strong>Tiempo agotado.</strong></p>`);
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function renderLibrary() {
  pageTitle.textContent = "Biblioteca Normativa";
  pageSubtitle.textContent = "Repositorio técnico de documentos y normas.";

  root.innerHTML = `
    <div class="panel">
      <ul>
        ${appData.norms.map(n => `<li>${n}</li>`).join("")}
      </ul>
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

navButtons.forEach(btn => {
  btn.addEventListener("click", () => renderView(btn.dataset.view));
});

renderDashboard();
