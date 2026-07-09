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
  }
];

function setActive(view) {
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
}

function renderDashboard() {
  pageTitle.textContent = "Dashboard";
  pageSubtitle.textContent = "Resumen general";

  root.innerHTML = `
    <div class="panel">
      <h3>Buscar casos</h3>
      <input id="case-search" class="search" type="text" placeholder="Escribe un tema" />
    </div>

    <div class="grid metrics">
      ${appData.dashboard.metrics.map(m => `
        <div class="card">
          <span class="label">${m.label}</span>
          <strong class="value">${m.value}</strong>
        </div>
      `).join("")}
    </div>

    <h3>Progreso</h3>
    <div class="progress-list">
      ${appData.dashboard.progress.map(p => `
        <div>
          <div class="progress-head"><span>${p.label}</span><span>${p.value}%</span></div>
          <div class="bar"><span style="width:${p.value}%"></span></div>
        </div>
      `).join("")}
    </div>

    <h3>Casos sugeridos</h3>
    <div class="grid cases">
      ${cases.map(c => `
        <button class="case-card" data-case="${c.id}" data-search="${(c.title + " " + c.tags.join(" ") + " " + c.level + " " + c.specialty).toLowerCase()}">
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

  const search = document.getElementById("case-search");
  search.addEventListener("input", e => {
    const text = e.target.value.toLowerCase().trim();
    document.querySelectorAll(".case-card").forEach(card => {
      card.style.display = card.dataset.search.includes(text) ? "flex" : "none";
    });
  });
}

function renderCase(id) {
  const c = cases.find(x => x.id === id);
  pageTitle.textContent = c.title;
  pageSubtitle.textContent = `${c.level} · ${c.specialty}`;

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
        ${c.options.map((opt, idx) => `<button class="option-btn" data-opt="${idx}">${opt}</button>`).join("")}
      </div>
    </div>

    <div id="feedback-zone"></div>
  `;

  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const picked = Number(btn.dataset.opt);
      const ok = picked === c.correct;
      if (ok) {
        score += 1;
        localStorage.setItem("preSerumScore", String(score));
      }
      document.getElementById("feedback-zone").innerHTML = `
        <div class="panel ${ok ? "success" : "error"}">
          <h3>${ok ? "Correcto" : "Incorrecto"}</h3>
          <p>${c.feedback}</p>
          <p><strong>Puntaje:</strong> ${score}</p>
        </div>
      `;
      document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
    });
  });
}

function renderSimulator() {
  pageTitle.textContent = "Simulador";
  pageSubtitle.textContent = "Cronómetro y práctica";

  root.innerHTML = `
    <div class="panel">
      <p>Tiempo restante: <strong id="timer-label">01:00</strong></p>
      <p>Puntaje: <strong>${score}</strong></p>
      <button id="start-timer" class="action-btn">Iniciar</button>
      <button id="stop-timer" class="action-btn secondary">Detener</button>
    </div>
  `;

  document.getElementById("start-timer").addEventListener("click", () => {
    if (timerId) clearInterval(timerId);
    timeLeft = 60;
    document.getElementById("timer-label").textContent = "01:00";
    timerId = setInterval(() => {
      timeLeft--;
      document.getElementById("timer-label").textContent = String(Math.floor(timeLeft / 60)).padStart(2, "0") + ":" + String(timeLeft % 60).padStart(2, "0");
      if (timeLeft <= 0) clearInterval(timerId);
    }, 1000);
  });

  document.getElementById("stop-timer").addEventListener("click", () => {
    if (timerId) clearInterval(timerId);
  });
}

function renderLibrary() {
  pageTitle.textContent = "Biblioteca";
  pageSubtitle.textContent = "Normativa";

  root.innerHTML = `
    <div class="panel">
      <ul>
        ${appData.norms.map(n => `<li>${n}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderView(view) {
  setActive(view);
  if (view === "dashboard") renderDashboard();
  if (view === "cases") renderDashboard();
  if (view === "simulator") renderSimulator();
  if (view === "library") renderLibrary();
}

navButtons.forEach(btn => btn.addEventListener("click", () => renderView(btn.dataset.view)));
renderDashboard();
