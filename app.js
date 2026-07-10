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
let currentList = [];      // lista filtrada vigente, para "Siguiente caso"
let selectedOption = null; // opción marcada, aún no confirmada
let confirmed = false;     // true tras pulsar "Confirmar respuesta"

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

  const careers = [...new Set(data.cases.map(c => c.career || c.specialty))];
  const byCareer = careers.map(career => {
    const casesOfCareer = data.cases.filter(c => (c.career || c.specialty) === career);
    const resolved = casesOfCareer.filter(c => (caseState[c.id] || {}).correct).length;
    return { career, total: casesOfCareer.length, resolved };
  });

  const byBlock = data.chips.map(block => {
    const casesOfBlock = data.cases.filter(c => c.block === block);
    const resolved = casesOfBlock.filter(c => (caseState[c.id] || {}).correct).length;
    return { block, total: casesOfBlock.length, resolved };
  }).filter(b => b.total > 0);

  root.innerHTML = `
    <section class="grid metrics">
      <div class="card"><span class="label">Puntaje</span><div class="value">${score}</div></div>
      <div class="card"><span class="label">Casos</span><div class="value">${data.cases.length}</div></div>
      <div class="card"><span class="label">Normas</span><div class="value">${data.norms.length}</div></div>
      <div class="card"><span class="label">Decretos</span><div class="value">${data.decrees.length}</div></div>
    </section>
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Progreso por carrera</h3>
        <div class="progress-list">
          ${byCareer.map(bc => {
            const pct = bc.total ? fmtPct(Math.round((bc.resolved / bc.total) * 100)) : 0;
            return `
              <div>
                <div class="progress-head"><span>${bc.career}</span><span>${bc.resolved}/${bc.total} · ${pct}%</span></div>
                <div class="bar"><span style="width:${pct}%"></span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <div class="panel">
        <h3 class="section-title">Progreso por bloque temático</h3>
        <div class="progress-list">
          ${byBlock.map(bb => {
            const pct = bb.total ? fmtPct(Math.round((bb.resolved / bb.total) * 100)) : 0;
            return `
              <div>
                <div class="progress-head"><span>${bb.block}</span><span>${bb.resolved}/${bb.total} · ${pct}%</span></div>
                <div class="bar"><span style="width:${pct}%"></span></div>
              </div>
            `;
          }).join("")}
        </div>
        <p style="margin-top:14px;color:#5B6E6A;line-height:1.5">Bloques temáticos oficiales SERUMS, con prioridad en Psicología e integración interdisciplinaria de las demás carreras de la salud.</p>
      </div>
    </section>
  `;
}

function renderCases() {
  pageTitle.textContent = "Casos interactivos";
  pageSubtitle.textContent = "Elige carrera, bloque o nivel para ver sus casos.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <input id="case-search" class="search" placeholder="Buscar caso, bloque o carrera..." />

        <details class="filter-box" open>
          <summary>Carrera</summary>
          <div class="option-list" id="career-list"></div>
        </details>

        <details class="filter-box">
          <summary>Bloque temático</summary>
          <div class="option-list" id="block-list"></div>
        </details>

        <details class="filter-box">
          <summary>Nivel de establecimiento</summary>
          <div class="option-list" id="level-list"></div>
        </details>

        <div class="case-list" id="case-list"></div>
      </div>

      <div class="panel" id="case-panel">
        <h3 class="section-title">Selecciona un caso</h3>
        <p>Elige un filtro y luego un caso de la lista para comenzar.</p>
      </div>
    </section>
  `;

  const list = document.getElementById("case-list");
  const search = document.getElementById("case-search");
  const careerList = document.getElementById("career-list");
  const blockList = document.getElementById("block-list");
  const levelList = document.getElementById("level-list");

  const careers = [...new Set(data.cases.map(c => c.career || c.specialty))];
  const blocks = [...new Set(data.cases.map(c => c.block))];
  const levels = [...new Set(data.cases.map(c => c.level))].sort();

  let selectedCareer = "";
  let selectedBlock = "";
  let selectedLevel = "";

  function renderFilters() {
    careerList.innerHTML = careers.map(c => `
      <button class="option-btn" data-career="${c}">${c}</button>
    `).join("");

    blockList.innerHTML = blocks.map(b => `
      <button class="option-btn" data-block="${b}">${b}</button>
    `).join("");

    levelList.innerHTML = levels.map(l => `
      <button class="option-btn" data-level="${l}">${l}</button>
    `).join("");

    careerList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedCareer = selectedCareer === btn.dataset.career ? "" : btn.dataset.career;
        draw(search.value);
      });
    });

    blockList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedBlock = selectedBlock === btn.dataset.block ? "" : btn.dataset.block;
        draw(search.value);
      });
    });

    levelList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedLevel = selectedLevel === btn.dataset.level ? "" : btn.dataset.level;
        draw(search.value);
      });
    });
  }

  function draw(filter = "") {
    const q = filter.toLowerCase();
    const filtered = data.cases.filter(c => {
      const text = [c.title, c.block, c.specialty, c.career, c.statement, ...(c.tags || [])].join(" ").toLowerCase();
      return text.includes(q) &&
        (!selectedCareer || (c.career || c.specialty) === selectedCareer) &&
        (!selectedBlock || c.block === selectedBlock) &&
        (!selectedLevel || c.level === selectedLevel);
    });

    currentList = filtered;

    list.innerHTML = filtered.map(c => {
      const st = caseState[c.id];
      const doneTag = st && st.correct ? `<span class="badge">Resuelto</span>` : "";
      return `
        <button class="case-card" data-id="${c.id}">
          <span>${c.career || c.specialty} · ${c.block} · ${c.level}</span>
          <strong>${c.title}</strong>
          <small>${c.statement}</small>
          ${doneTag}
        </button>
      `;
    }).join("") || `<p style="color:#5B6E6A">No hay casos con este filtro.</p>`;

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
  selectedOption = null;
  confirmed = false;
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

  const optionsHtml = activeCase.options.map((o, i) => {
    let cls = "option-btn";
    if (confirmed) {
      if (i === activeCase.correct) cls += " success";
      else if (i === selectedOption) cls += " error";
    } else if (i === selectedOption) {
      cls += " selected";
    }
    return `<button class="${cls}" data-opt="${i}" ${confirmed ? "disabled" : ""}>${String.fromCharCode(65 + i)}. ${o}</button>`;
  }).join("");

  const interNote = activeCase.interdisciplinaryNote
    ? `<p style="margin-top:10px;color:#5B6E6A"><strong>Enfoque interdisciplinario:</strong> ${activeCase.interdisciplinaryNote}</p>`
    : "";

  panel.innerHTML = `
    <div class="badge">${activeCase.career || activeCase.specialty} · ${activeCase.block} · ${activeCase.level}</div>
    <h3 class="section-title">${activeCase.title}</h3>
    <p>${activeCase.statement}</p>
    <p><strong>${activeCase.question}</strong></p>
    <div class="option-list">${optionsHtml}</div>
    <div class="chips" style="margin-top:12px">${(activeCase.tags || []).map(t => `<span class="chip">${t}</span>`).join("")}</div>
    <p style="margin-top:12px;color:#5B6E6A">Tiempo: ${timeLeft}s · Intentos: ${st.attempts} · Puntaje: ${score}</p>
    <div id="case-feedback" style="margin-top:12px"></div>
    <div id="case-actions" style="margin-top:12px"></div>
  `;

  panel.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirmed) return;
      selectedOption = Number(btn.dataset.opt);
      renderCasePanel();
    });
  });

  const actions = document.getElementById("case-actions");
  const feedback = document.getElementById("case-feedback");

  if (!confirmed) {
    actions.innerHTML = `<button class="action-btn" id="confirm-btn" ${selectedOption === null ? "disabled" : ""}>Confirmar respuesta</button>`;
    document.getElementById("confirm-btn").addEventListener("click", confirmAnswer);
  } else {
    const correct = selectedOption === activeCase.correct;
    feedback.innerHTML = `
      <div class="card ${correct ? "success" : "error"}">
        <strong>${correct ? "Correcto" : "Incorrecto"}</strong>
        <p>${activeCase.feedback}</p>
      </div>
      ${interNote}
    `;
    actions.innerHTML = `
      ${!correct ? `<button class="action-btn secondary" id="retry-btn">Reintentar</button>` : ""}
      <button class="action-btn" id="next-btn">Siguiente caso →</button>
    `;
    if (!correct) document.getElementById("retry-btn").addEventListener("click", retryAnswer);
    document.getElementById("next-btn").addEventListener("click", nextCase);
  }
}

function confirmAnswer() {
  if (!activeCase || selectedOption === null || confirmed) return;
  confirmed = true;

  const correct = selectedOption === activeCase.correct;
  const st = caseState[activeCase.id] || { attempts: 0, correct: false, history: [] };
  st.attempts += 1;
  st.correct = st.correct || correct;
  st.history = st.history || [];
  st.history.push({ date: new Date().toISOString(), selectedIndex: selectedOption, correct });
  caseState[activeCase.id] = st;

  if (correct) score += 10;

  localStorage.setItem(data.scoreKey, String(score));
  saveProgress(data.caseStateKey, caseState);
  updateBadges();
  clearInterval(timerId);
  renderCasePanel();
}

function retryAnswer() {
  selectedOption = null;
  confirmed = false;
  timeLeft = 60;
  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) { timeLeft = 0; clearInterval(timerId); }
    renderCasePanel();
  }, 1000);
  renderCasePanel();
}

function nextCase() {
  if (!currentList.length) return;
  const idx = currentList.findIndex(c => c.id === activeCase.id);
  const next = currentList[(idx + 1) % currentList.length];
  openCase(next.id);
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
        <p style="line-height:1.6;color:#5B6E6A">La Ley N.° 23330 figura como norma base del SERUMS, complementada por su reglamento y las modificatorias vigentes que el MINSA publica junto con la bibliografía oficial de cada proceso.</p>
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
        <p style="line-height:1.6;color:#5B6E6A">Esta sección deja preparado el proyecto para cargar más resoluciones, directivas y lineamientos oficiales sin tocar la arquitectura.</p>
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
