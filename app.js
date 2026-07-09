const root = document.getElementById("view-root");
const buttons = document.querySelectorAll(".nav-btn");

function renderDashboard() {
  root.innerHTML = `
    <h2>Dashboard</h2>
    <div class="cards">
      ${appData.dashboard.progress.map(p => `
        <div class="card">
          <div class="card-title">${p.label}</div>
          <div class="bar"><span style="width:${p.value}%"></span></div>
          <div class="card-value">${p.value}%</div>
        </div>
      `).join("")}
    </div>
    <h3>Casos sugeridos</h3>
    <div class="cases">
      ${appData.dashboard.cases.map(c => `
        <button class="case-card" data-case="${c.id}">
          <strong>${c.title}</strong>
          <span>${c.level} · ${c.specialty}</span>
          <small>${c.summary}</small>
        </button>
      `).join("")}
    </div>
  `;
  document.querySelectorAll(".case-card").forEach(btn => {
    btn.addEventListener("click", () => renderCase(Number(btn.dataset.case)));
  });
}

function renderCase(id) {
  const c = appData.dashboard.cases.find(x => x.id === id);
  root.innerHTML = `
    <h2>${c.title}</h2>
    <p><b>Nivel:</b> ${c.level} | <b>Especialidad:</b> ${c.specialty}</p>
    <div class="panel">
      <h3>Enunciado</h3>
      <p>Paciente adolescente llega a un establecimiento I-2 con ideación suicida, antecedente de violencia y red de apoyo limitada.</p>
    </div>
    <div class="panel">
      <h3>Decisión</h3>
      <button class="action-btn" id="decide">Intervenir y referir</button>
    </div>
    <div id="feedback"></div>
  `;

  document.getElementById("decide").addEventListener("click", () => {
    document.getElementById("feedback").innerHTML = `
      <div class="panel success">
        <h3>Retroalimentación</h3>
        <p>Conducta correcta: contención inicial, estabilización y referencia urgente según norma.</p>
        <ul>${appData.norms.map(n => `<li>${n}</li>`).join("")}</ul>
      </div>
    `;
  });
}

function renderSimulator() {
  root.innerHTML = `
    <h2>Simulador</h2>
    <div class="panel">
      <p>Modo cronometrado, preguntas largas y resultados por bloque.</p>
      <button class="action-btn">Iniciar examen</button>
    </div>
  `;
}

function renderLibrary() {
  root.innerHTML = `
    <h2>Biblioteca Normativa</h2>
    <div class="panel">
      <ul>${appData.norms.map(n => `<li>${n}</li>`).join("")}</ul>
    </div>
  `;
}

function setView(view) {
  buttons.forEach(b => b.classList.toggle("active", b.dataset.view === view));
  if (view === "dashboard") renderDashboard();
  if (view === "cases") renderDashboard();
  if (view === "simulator") renderSimulator();
  if (view === "library") renderLibrary();
}

buttons.forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
setView("dashboard");
