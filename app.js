const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

if (!root || !pageTitle || !pageSubtitle) {
  throw new Error("Faltan elementos base en index.html");
}

let timerId = null;
let timeLeft = 60;
let score = Number(localStorage.getItem("preSerumScore") || 0);

const interactiveCases = [
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
    feedback: "La conducta correcta es intervenir en crisis, estabilizar y derivar con urgencia por riesgo alto."
  },
  {
    id: 2,
    title: "Violencia familiar con ansiedad",
    level: "I-2",
    specialty: "Psicología",
    tags: ["violencia familiar", "ansiedad", "tamizaje"],
    statement: "Mujer adulta consulta por insomnio, ansiedad y dolor somático. Refiere episodios de violencia familiar y temor al regresar a casa.",
    question: "¿Qué acción corresponde primero?",
    options: [
      "Tamizar riesgo, brindar soporte inicial y derivar según norma.",
      "Solo prescribir descanso y control posterior.",
      "Ignorar el antecedente para evitar revictimización."
    ],
    correct: 0,
    feedback: "Primero se debe tamizar, brindar soporte inicial y definir derivación según el nivel de riesgo."
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
    feedback: "La intervención inicial es contención emocional, evaluación breve y educación para disminuir la crisis."
  }
];

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
    if (timeLeft <= 0) {
      stopTimer();
      const panel = document.querySelector(".panel.timer-panel");
      if (panel) panel.insertAdjacentHTML("beforeend", `<p><strong>Tiempo agotado.</strong></p>`);
    }
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
  pageSubtitle.textContent = "Resumen general del progreso y acceso a los módulos.";

  root.innerHTML = `
    <div class="panel">
      <h3>Buscar casos</h3>
      <input id="case-search" class="search" type="text" placeholder="Escribe un tema, etiqueta o nivel" />
    </div>

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
    <div id="case-list" class="grid cases">
      ${interactiveCases.map(renderCaseCard).join("")}
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
        const hay = card.dataset.search || "";
        card.style.display = hay.includes(text) ? "flex" : "none";
      });
    });
  }
}

function renderCase(id) {
  const c = interactiveCases.find(x => x.id === id);
  pageTitle.textContent = c.title;
  pageSubtitle.textContent = `${c.level} · ${c.specialty} · Caso interactivo`;

  root.innerHTML = `
    <div class="panel">
      <h3>Etiquetas</h3>
      <div class="chips">
        ${c.tags.map(t => `<span class="chip">${t}</span>`).join("")}
      </div>
    </div>

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
      if (correct) {
        score += 1;
        saveScore();
      }
      document.getElementById("case-feedback").innerHTML = `
        <div class="panel ${correct ? "success" : "error"}">
          <h3>${correct ? "Correcto" : "Incorrecto"}</h3>
          <p>${c.feedback}</p>
          <p><strong>Puntaje:</strong> ${score}</p>
        </div>
      `;
      document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
    });
  });

  const nextBtn = document.getElementById("next-case");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const idx = (interactiveCases.findIndex(x => x.id === id) + 1) % interactiveCases.length;
      renderCase(interactiveCases[idx].id);
    });
  }
}

function renderSimulator() {
  pageTitle.textContent = "Simulador";
  pageSubtitle.textContent = "Modo cronometrado y preguntas largas.";

  root.innerHTML = `
    <div class="panel timer-panel">
      <h3>Simulador cronometrado</h3>
      <p>Tiempo restante: <strong id="timer-label">${formatTime(timeLeft)}</strong></p>
      <p>Puntaje acumulado: <strong id="score-label">${score}</strong></p>
      <button id="start-timer" class="action-btn">Iniciar cronómetro</button>
      <button id="stop-timer" class="action-btn secondary">Detener</button>
    </div>

    <div class="panel">
      <h3>Pregunta de práctica</h3>
      <p>Paciente con riesgo psicosocial y necesidad de derivación. Selecciona una opción para practicar el control del tiempo.</p>
    </div>
  `;

  const start = document.getElementById("start-timer");
  const stop = document.getElementById("stop-timer");
  if (start) start.addEventListener("click", startTimer);
  if (stop) stop.addEventListener("click", stopTimer);
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
