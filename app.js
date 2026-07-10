const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const scoreBadge = document.getElementById("score-badge");
const resolvedBadge = document.getElementById("resolved-badge");
const data = window.SERUMS_DATA;

let score = Number(localStorage.getItem(data.scoreKey) || 0);
let caseState = loadProgress(data.caseStateKey, {});
let notes = localStorage.getItem(data.notesKey) || "";
let timerId = null;
let timeLeft = 60;
let activeCase = null;

function loadProgress(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function saveProgress(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setActive(view) {
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
}

function updateBadges() {
  scoreBadge.textContent = String(score);
  resolvedBadge.textContent = String(Object.values(caseState).filter(x => x.correct).length);
}

function fmtPct(n) {
  return Math.max(0, Math.min(100, n));
}

function renderDashboard() {
  pageTitle.textContent = "Tablero SERUMS";
  pageSubtitle.textContent = "Casos, normativa y progreso en una sola vista.";
  root.innerHTML = `
    <section class="grid metrics">
      <div class="card"><span class="label">Puntaje</span><div class="value">${score}</div></div>
      <div class="card"><span class="label">Casos</span><div class="value">${data.cases.length}</div></div>
      <div class="card"><span class="label">Normas</span><div class="value">${data.norms.length}</div></div>
      <div class="card"><span class="label">Decretos</span><div class="value">${data.decrees.length}</div></div>
    </section>
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Progreso por caso</h3>
        <div class="progress-list">
          ${data.cases.map(c => {
            const st = caseState[c.id] || { attempts: 0, correct: false };
            const pct = st.correct ? 100 : fmtPct(st.attempts * 35);
            return `
              <div>
                <div class="progress-head"><span>${c.title}</span><span>${pct}%</span></div>
                <div class="bar"><span style="width:${pct}%"></span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <div class="panel">
        <h3 class="section-title">Bloques oficiales</h3>
        <div class="chips">
          ${data.chips.map(ch => `<span class="chip">${ch}</span>`).join("")}
        </div>
        <p style="margin-top:14px;color:#64748b;line-height:1.5">La app organiza el estudio según los bloques temáticos SERUMS publicados por el MINSA.</p>
      </div>
    </section>
  `;
}

function renderCases() {
  pageTitle.textContent = "Casos interactivos";
  pageSubtitle.textContent = "Abre un filtro y elige una especialidad para ver sus casos.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <input id="case-search" class="search" placeholder="Buscar caso, bloque o especialidad..." />

        <details class="filter-box" open>
          <summary>Especialidad</summary>
          <div class="option-list" id="specialty-list"></div>
        </details>

        <details class="filter-box">
          <summary>Bloque temático</summary>
          <div class="option-list" id="block-list"></div>
        </details>

        <div class="case-list" id="case-list"></div>
      </div>

      <div class="panel" id="case-panel">
        <h3 class="section-title">Selecciona un caso</h3>
        <p>Abre un filtro y elige una opción para cargar los casos relacionados.</p>
      </div>
    </section>
  `;

  const list = document.getElementById("case-list");
  const search = document.getElementById("case-search");
  const specialtyList = document.getElementById("specialty-list");
  const blockList = document.getElementById("block-list");

  const specialties = [...new Set(data.cases.map(c => c.specialty))];
  const blocks = [...new Set(data.cases.map(c => c.block))];

  let selectedSpecialty = "";
  let selectedBlock = "";

  function renderFilters() {
    specialtyList.innerHTML = specialties.map(s => `
      <button class="option-btn" data-specialty="${s}">${s}</button>
    `).join("");

    blockList.innerHTML = blocks.map(b => `
      <button class="option-btn" data-block="${b}">${b}</button>
    `).join("");

    specialtyList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSpecialty = btn.dataset.specialty;
        draw(search.value);
      });
    });

    blockList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedBlock = btn.dataset.block;
        draw(search.value);
      });
    });
  }

  function draw(filter = "") {
    const q = filter.toLowerCase();
    const filtered = data.cases.filter(c => {
      const text = [c.title, c.block, c.specialty, c.statement, ...(c.tags || [])].join(" ").toLowerCase();
      return text.includes(q) &&
        (!selectedSpecialty || c.specialty === selectedSpecialty) &&
        (!selectedBlock || c.block === selectedBlock);
    });

    list.innerHTML = filtered.map(c => `
      <button class="case-card" data-id="${c.id}">
        <span>${c.block} · ${c.level}</span>
        <strong>${c.title}</strong>
        <small>${c.specialty}</small>
        <small>${c.statement}</small>
      </button>
    `).join("");

    list.querySelectorAll(".case-card").forEach(btn => {
      btn.addEventListener("click", () => openCase(Number(btn.dataset.id)));
    });
  }

  search.addEventListener("input", e => draw(e.target.value));
  renderFilters();
  draw();
}

function openCase(id) {
  activeCase = data.cases.find(c => c.id === id);
  timeLeft = 60;
  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      timeLeft = 0;
      clearInterval(timerId);
    }
    renderCasePanel();
  }, 1000);
  renderCasePanel();
}

function renderCasePanel() {
  const panel = document.getElementById("case-panel");
  if (!panel || !activeCase) return;
  const st = caseState[activeCase.id] || { attempts: 0, correct: false };

  panel.innerHTML = `
    <div class="badge">${activeCase.block} · ${activeCase.level}</div>
    <h3 class="section-title">${activeCase.title}</h3>
    <p>${activeCase.statement}</p>
    <p><strong>${activeCase.question}</strong></p>
    <div class="option-list">
      ${activeCase.options.map((o, i) => `<button class="option-btn" data-opt="${i}">${o}</button>`).join("")}
    </div>
    <div class="chips" style="margin-top:12px">${(activeCase.tags || []).map(t => `<span class="chip">${t}</span>`).join("")}</div>
    <p style="margin-top:12px;color:#64748b">Tiempo: ${timeLeft}s · Intentos: ${st.attempts} · Puntaje: ${score}</p>
    <div id="case-feedback" style="margin-top:12px"></div>
  `;

  panel.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => gradeCase(Number(btn.dataset.opt)));
  });
}

function gradeCase(opt) {
  if (!activeCase) return;
  const correct = opt === activeCase.correct;
  const st = caseState[activeCase.id] || { attempts: 0, correct: false };
  st.attempts += 1;
  st.correct = st.correct || correct;
  caseState[activeCase.id] = st;

  if (correct) score += 10;

  localStorage.setItem(data.scoreKey, String(score));
  saveProgress(data.caseStateKey, caseState);
  updateBadges();

  const feedback = document.getElementById("case-feedback");
  feedback.innerHTML = `
    <div class="card ${correct ? "success" : "error"}">
      <strong>${correct ? "Correcto" : "Incorrecto"}</strong>
      <p>${activeCase.feedback}</p>
    </div>
  `;

  if (correct) clearInterval(timerId);
  renderCasePanel();
}

function renderNorms() {
  pageTitle.textContent = "Normativa SERUMS";
  pageSubtitle.textContent = "Ley base, bibliografía oficial y normas de evaluación.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Normas principales</h3>
        <div class="norm-list">
          ${data.norms.map((n, i) => `
            <article class="norm-card">
              <span>${n.code}</span>
              <h3>${n.title}</h3>
              <p>${n.summary}</p>
              <button class="toggle" data-target="norm-${i}">Ver detalle</button>
              <div class="toggle-panel" id="norm-${i}">
                <p>${n.detail}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
      <div class="panel">
        <h3 class="section-title">Base oficial</h3>
        <p style="line-height:1.6;color:#64748b">La Ley N.° 23330 figura como norma base del SERUMS en GOB.PE y el MINSA publica la bibliografía oficial de evaluación 2026 con los bloques temáticos que guían el estudio.</p>
      </div>
    </section>
  `;
  bindToggles();
}

function renderDecrees() {
  pageTitle.textContent = "Decretos y lineamientos";
  pageSubtitle.textContent = "Estructura expandible para resoluciones, decretos y directivas.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Documentos</h3>
        <div class="norm-list">
          ${data.decrees.map((d, i) => `
            <article class="norm-card">
              <span>${d.code}</span>
              <h3>${d.title}</h3>
              <p>${d.summary}</p>
              <button class="toggle" data-target="dec-${i}">Ver detalle</button>
              <div class="toggle-panel" id="dec-${i}">
                <p>${d.detail}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
      <div class="panel">
        <h3 class="section-title">Enfoque</h3>
        <p style="line-height:1.6;color:#64748b">Esta sección deja preparado el proyecto para cargar más resoluciones, directivas y lineamientos oficiales sin tocar la arquitectura.</p>
      </div>
    </section>
  `;
  bindToggles();
}

function renderResources() {
  pageTitle.textContent = "Recursos";
  pageSubtitle.textContent = "Apuntes, compendios y material de apoyo.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Material de estudio</h3>
        <div class="resource-list">
          ${data.resources.map(r => `
            <article class="resource-card">
              <span>${r.type}</span>
              <h3>${r.title}</h3>
              <p>${r.summary}</p>
            </article>
          `).join("")}
        </div>
      </div>
      <div class="panel">
        <h3 class="section-title">Notas rápidas</h3>
        <textarea id="notes" class="input" placeholder="Escribe aquí tus apuntes SERUMS...">${notes}</textarea>
        <button id="save-notes" class="action-btn">Guardar notas</button>
      </div>
    </section>
  `;
  document.getElementById("save-notes").addEventListener("click", () => {
    notes = document.getElementById("notes").value;
    localStorage.setItem(data.notesKey, notes);
  });
}

function bindToggles() {
  root.querySelectorAll(".toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.target).classList.toggle("open");
    });
  });
}

function renderView(view) {
  clearInterval(timerId);
  timerId = null;
  activeCase = null;
  if (view === "dashboard") renderDashboard();
  if (view === "cases") renderCases();
  if (view === "norms") renderNorms();
  if (view === "decrees") renderDecrees();
  if (view === "resources") renderResources();
  setActive(view);
  updateBadges();
}

navButtons.forEach(btn => btn.addEventListener("click", () => renderView(btn.dataset.view)));
renderView("dashboard");
