const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

let timerId = null;
let timeLeft = 60;

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
      ${appData.cases.map(c => `
        <button class="case-card" data-case="${c.id}">
          <strong>${c.title}</strong>
          <span>${c.level} · ${c.specialty}</span>
          <small>${c.summary}</small>
        </button>
      `).join("")}
    </div>
  `;

  bindCaseCards();
}

function bindCaseCards() {
  document.querySelectorAll(".case-card").forEach(btn => {
    btn.addEventListener("click", () => renderCase(Number(btn.dataset.case)));
  });
}

function renderCase(id) {
  const c = appData.cases.find(x => x.id === id);
  pageTitle.textContent = c.title;
  pageSubtitle.textContent = `${c.level} · ${c.specialty} · Caso típico de primer nivel`;

  root.innerHTML = `
    <div class="panel">
      <h3>Enunciado</h3>
      <p>${c.statement}</p>
    </div>

    <div class="panel">
      <h3>Decisión esperada</h3>
      <p>${c.decision}</p>
      <button id="show-feedback" class="action-btn">Ver retroalimentación</button>
    </div>

    <div id="feedback-zone"></div>
  `;

  document.getElementById("show-feedback").addEventListener("click", () => {
    document.getElementById("feedback-zone").innerHTML = `
      <div class="panel success">
        <h3>Retroalimentación técnica</h3>
        <ul>
          ${appData.norms.map(n => `<li>${n}</li>`).join("")}
        </ul>
        <p>Conducta correcta: priorizar seguridad, estabilización y referencia según corresponda.</p>
      </div>
    `;
  });
}

function renderSimulator() {
  pageTitle.textContent = "Simulador";
  pageSubtitle.textContent = "Modo cronometrado y preguntas largas.";

  root.innerHTML = `
    <div class="panel">
      <h3>Simulador cronometrado</h3>
      <p>Tiempo restante: <strong id="timer-label">${formatTime(timeLeft)}</strong></p>
      <p>Pregunta ejemplo: paciente con riesgo psicosocial y necesidad de derivación.</p>
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
  timerId = setInterval(() => {
    timeLeft -= 1;
    const timerLabel = document.getElementById("timer-label");
    if (timerLabel) timerLabel.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      stopTimer();
      const panel = document.querySelector(".panel");
      if (panel) {
        panel.insertAdjacentHTML("beforeend", `<p><strong>Tiempo agotado.</strong> Fin del simulador.</p>`);
      }
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
