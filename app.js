const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

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
      <p>Configuración base para examen por tiempo y por bloque temático.</p>
      <button class="action-btn">Iniciar simulación</button>
    </div>
  `;
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
