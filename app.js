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
let priorityReviewMode = false; // true cuando se navega desde "Repasar ahora"

// ---------- Simulacro (100 preguntas, 5 bloques oficiales SERUMS) ----------
const OFFICIAL_BLOCKS = ["Salud pública", "Cuidado integral", "Ética e interculturalidad", "Investigación", "Gestión"];
const SIMULACRO_TARGET = 100;
const SIMULACRO_SECONDS_PER_Q = 60; // ritmo de referencia ~1 min/pregunta

// Distribución aproximada por bloque, calculada a partir de la lectura de 4 exámenes reales
// SERUMS Psicología (2025-I tipo A/B, 2025-I agosto, 2026-I — 400 preguntas en total).
// Es una aproximación manual (no un conteo automatizado exacto) y debe tratarse como
// una calibración inicial: se ajustará según se sumen exámenes reales de más profesiones.
// Si una carrera no tiene pesos propios calculados aún, se usa este mismo perfil por defecto.
const REAL_EXAM_BLOCK_WEIGHTS = {
  "Gestión": 0.26,
  "Salud pública": 0.26,
  "Ética e interculturalidad": 0.16,
  "Cuidado integral": 0.18,
  "Investigación": 0.14
};

let simulacroQueue = [];
let simulacroIndex = 0;
let simulacroResults = []; // {caseId, career, block, correct}
let simulacroSelected = null;
let simulacroConfirmed = false;
let simulacroTimerId = null;
let simulacroTimeLeft = 0;
let simulacroPhase = "intro"; // intro | running | finished
let simulacroHistory = loadProgress("simulacroHistory", []);
let simulacroCareer = localStorage.getItem("simulacroCareer") || ""; // "" = todas las carreras (modo mixto)

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Devuelve una copia del caso con sus opciones en orden aleatorio y el índice
// "correct" ya remapeado a esa nueva posición. Se usa tanto en la práctica
// individual (openCase) como en el Simulacro, para que la respuesta correcta
// no quede siempre en la misma letra.
function shuffleCaseOptions(original) {
  const order = original.options.map((_, i) => i);
  const shuffledOrder = shuffle(order);
  const newCorrect = shuffledOrder.indexOf(original.correct);
  return { ...original, options: shuffledOrder.map(i => original.options[i]), correct: newCorrect };
}

// Casos ya usados en los últimos 2 intentos de simulacro (para no repetirlos de inmediato
// en el siguiente intento, salvo que no haya suficientes casos alternativos disponibles).
function recentlyUsedCaseIds() {
  const recent = simulacroHistory.slice(-2);
  const ids = new Set();
  recent.forEach(r => (r.caseIds || []).forEach(id => ids.add(id)));
  return ids;
}

// Dentro de un pool ya filtrado, separa primero los casos NO usados recientemente
// (para priorizarlos) y deja los usados recientemente al final como relleno.
function orderPoolAvoidingRepeats(pool, usedIds) {
  const fresh = shuffle(pool.filter(c => !usedIds.has(c.id)));
  const repeated = shuffle(pool.filter(c => usedIds.has(c.id)));
  return fresh.concat(repeated);
}

// Muestreo estratificado: reparte cupos entre los 5 bloques oficiales según la
// distribución real observada en exámenes SERUMS (REAL_EXAM_BLOCK_WEIGHTS), respetando
// el máximo disponible en cada bloque, evitando repetir preguntas de los últimos intentos
// cuando hay alternativas suficientes, y filtrando por carrera los bloques clínicos
// (Cuidado integral y el bloque propio de cada profesión, p. ej. "Psicología") para que
// el simulacro de una carrera no mezcle casos clínicos de otra, igual que el examen real.
function buildSimulacroQueue(career) {
  const usedIds = recentlyUsedCaseIds();
  const isClinicalBlock = b => b === "Cuidado integral" || !OFFICIAL_BLOCKS.includes(b);
  const matchesCareer = c => !career || c.career === career || c.career === "Transversal";

  const pools = {};
  OFFICIAL_BLOCKS.forEach(b => {
    let cases = data.cases.filter(c => c.block === b);
    if (isClinicalBlock(b)) cases = cases.filter(matchesCareer);
    pools[b] = orderPoolAvoidingRepeats(cases, usedIds);
  });
  // Casos que no caen en un bloque oficial (p. ej. "Psicología" como bloque propio):
  // solo se ofrecen como relleno si corresponden a la carrera elegida (o no se eligió ninguna).
  const extraPool = orderPoolAvoidingRepeats(
    data.cases.filter(c => !OFFICIAL_BLOCKS.includes(c.block) && matchesCareer(c)),
    usedIds
  );

  const totalAvailable = OFFICIAL_BLOCKS.reduce((sum, b) => sum + pools[b].length, 0) + extraPool.length;
  const target = Math.min(SIMULACRO_TARGET, totalAvailable);

  // Cupo base por bloque según el peso real observado (en vez de un reparto uniforme)
  const weights = REAL_EXAM_BLOCK_WEIGHTS;
  const baseQuotas = {};
  OFFICIAL_BLOCKS.forEach(b => { baseQuotas[b] = Math.round(target * (weights[b] || (1 / OFFICIAL_BLOCKS.length))); });
  const capPerBlock = {};
  OFFICIAL_BLOCKS.forEach(b => { capPerBlock[b] = Math.ceil(baseQuotas[b] * 1.5); });

  let queue = [];
  let remainder = target;
  const taken = {};

  OFFICIAL_BLOCKS.forEach(b => {
    const take = Math.min(baseQuotas[b], pools[b].length);
    queue = queue.concat(pools[b].slice(0, take));
    taken[b] = take;
    remainder -= take;
  });

  // Completar remanente respetando el tope por bloque, en orden aleatorio de bloques
  let blocksCycle = shuffle(OFFICIAL_BLOCKS);
  let progress = true;
  while (remainder > 0 && progress) {
    progress = false;
    for (const b of blocksCycle) {
      if (remainder <= 0) break;
      if (taken[b] < Math.min(capPerBlock[b], pools[b].length)) {
        queue.push(pools[b][taken[b]]);
        taken[b] += 1;
        remainder -= 1;
        progress = true;
      }
    }
  }

  // Si aún falta (bloques oficiales en su tope), usar el pool extra (p. ej. Psicología)
  if (remainder > 0 && extraPool.length) {
    const take = Math.min(remainder, extraPool.length);
    queue = queue.concat(extraPool.slice(0, take));
    remainder -= take;
  }

  // Último recurso: si sigue faltando, exceder el tope en bloques oficiales con margen real
  if (remainder > 0) {
    progress = true;
    while (remainder > 0 && progress) {
      progress = false;
      for (const b of blocksCycle) {
        if (remainder <= 0) break;
        if (taken[b] < pools[b].length) {
          queue.push(pools[b][taken[b]]);
          taken[b] += 1;
          remainder -= 1;
          progress = true;
        }
      }
    }
  }

  return shuffle(queue).map(shuffleCaseOptions);
}

function goToSimulacro() {
  priorityReviewMode = false;
  renderView("simulacro");
}

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

// Prioridad de repaso: 0 = nunca intentado (máxima prioridad),
// 1 = intentado pero con error (ordenado por más antiguo primero),
// 2 = ya resuelto correctamente (ordenado por más antiguo primero, para refuerzo espaciado).
function reviewPriority(c) {
  const st = caseState[c.id];
  if (!st || !st.attempts) return { tier: 0, date: "" };
  const lastDate = st.lastAttemptDate || (st.history && st.history.length ? st.history[st.history.length - 1].date : "");
  return { tier: st.correct ? 2 : 1, date: lastDate };
}

function sortByPriority(list) {
  return [...list].sort((a, b) => {
    const pa = reviewPriority(a);
    const pb = reviewPriority(b);
    if (pa.tier !== pb.tier) return pa.tier - pb.tier;
    return (pa.date || "").localeCompare(pb.date || "");
  });
}

function goToReview() {
  priorityReviewMode = true;
  renderView("cases");
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
      <div class="card"><span class="label">Normas prioritarias 2026</span><div class="value">${data.priorityNorms2026.length}</div></div>
      <div class="card"><span class="label">Decretos</span><div class="value">${data.decrees.length}</div></div>
    </section>
    <section style="margin-bottom:16px">
      <button id="review-btn" class="action-btn">Repasar ahora →</button>
      <span style="margin-left:10px;color:#5B6E6A;font-size:13px">Prioriza casos nunca intentados y con error, empezando por los más antiguos.</span>
    </section>
    <section style="margin-bottom:16px">
      <button id="exam-registry-btn" class="toggle">📚 Base de Datos SERUMS — exámenes reales analizados</button>
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
  document.getElementById("review-btn").addEventListener("click", goToReview);
  document.getElementById("exam-registry-btn").addEventListener("click", () => renderView("examRegistry"));
}

function renderCases() {
  pageTitle.textContent = priorityReviewMode ? "Repaso priorizado" : "Casos interactivos";
  pageSubtitle.textContent = priorityReviewMode
    ? "Orden sugerido: nunca intentados primero, luego con error, luego resueltos hace más tiempo."
    : "Elige carrera, bloque o nivel para ver sus casos.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <input id="case-search" class="search" placeholder="Buscar caso, bloque o carrera..." />

        <button id="priority-toggle" class="toggle">${priorityReviewMode ? "✓ Repaso priorizado activo — click para desactivar" : "Activar orden de repaso priorizado"}</button>

        <details class="filter-box" id="filter-career" open>
          <summary>Carrera</summary>
          <div class="option-list" id="career-list"></div>
        </details>

        <details class="filter-box" id="filter-block">
          <summary>Bloque temático</summary>
          <div class="option-list" id="block-list"></div>
        </details>

        <details class="filter-box" id="filter-level">
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

  document.getElementById("priority-toggle").addEventListener("click", () => {
    priorityReviewMode = !priorityReviewMode;
    renderCases();
  });

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
        document.getElementById("filter-career").open = false;
        scrollToCaseList();
      });
    });

    blockList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedBlock = selectedBlock === btn.dataset.block ? "" : btn.dataset.block;
        draw(search.value);
        document.getElementById("filter-block").open = false;
        scrollToCaseList();
      });
    });

    levelList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedLevel = selectedLevel === btn.dataset.level ? "" : btn.dataset.level;
        draw(search.value);
        document.getElementById("filter-level").open = false;
        scrollToCaseList();
      });
    });
  }

  function scrollToCaseList() {
    // Pequeño retraso para que el DOM ya haya pintado la lista filtrada antes de desplazar
    setTimeout(() => {
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function draw(filter = "") {
    const q = filter.toLowerCase();
    let filtered = data.cases.filter(c => {
      const text = [c.title, c.block, c.specialty, c.career, c.statement, ...(c.tags || [])].join(" ").toLowerCase();
      return text.includes(q) &&
        (!selectedCareer || (c.career || c.specialty) === selectedCareer) &&
        (!selectedBlock || c.block === selectedBlock) &&
        (!selectedLevel || c.level === selectedLevel);
    });

    if (priorityReviewMode) filtered = sortByPriority(filtered);

    currentList = filtered;

    list.innerHTML = filtered.map(c => {
      const st = caseState[c.id];
      let statusTag = `<span class="badge">Nuevo</span>`;
      if (st && st.correct) statusTag = `<span class="badge">Resuelto</span>`;
      else if (st && st.attempts) statusTag = `<span class="badge" style="background:#FCEBEA;color:#8A2A24">Con error</span>`;
      return `
        <button class="case-card" data-id="${c.id}">
          <span>${c.career || c.specialty} · ${c.block} · ${c.level}</span>
          <strong>${c.title}</strong>
          <small>${c.statement}</small>
          ${statusTag}
        </button>
      `;
    }).join("") || `<p style="color:#5B6E6A">No hay casos con este filtro.</p>`;

    list.querySelectorAll(".case-card").forEach(btn => {
      btn.addEventListener("click", () => {
        openCase(Number(btn.dataset.id));
        const panel = document.getElementById("case-panel");
        if (panel) setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      });
    });
  }

  search.addEventListener("input", e => draw(e.target.value));
  renderFilters();
  draw();
}

function openCase(id) {
  const original = data.cases.find(c => c.id === id);
  activeCase = shuffleCaseOptions(original);
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

const MAX_ATTEMPTS_BEFORE_REVEAL = 2;

function renderCasePanel() {
  const panel = document.getElementById("case-panel");
  if (!panel || !activeCase) return;
  const st = caseState[activeCase.id] || { attempts: 0, correct: false };

  const correct = confirmed && selectedOption === activeCase.correct;
  // Solo se revela la opción correcta y la explicación técnica si acertó,
  // o si ya agotó los intentos permitidos. En un primer error, no se da pista.
  const reveal = confirmed && (correct || st.attempts >= MAX_ATTEMPTS_BEFORE_REVEAL);
  const attemptsLeft = Math.max(MAX_ATTEMPTS_BEFORE_REVEAL - st.attempts, 0);

  const optionsHtml = activeCase.options.map((o, i) => {
    let cls = "option-btn";
    if (confirmed) {
      if (reveal && i === activeCase.correct) cls += " success";
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
    <button id="back-to-filters-btn" class="toggle" style="margin-bottom:12px;margin-top:0">← Volver a carreras / filtros</button>
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

  const backBtn = document.getElementById("back-to-filters-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const careerFilter = document.getElementById("filter-career");
      if (careerFilter) careerFilter.open = true;
      const search = document.getElementById("case-search");
      if (search) search.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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
  } else if (correct) {
    feedback.innerHTML = `
      <div class="card success">
        <strong>Correcto</strong>
        <p>${activeCase.feedback}</p>
      </div>
      ${interNote}
    `;
    actions.innerHTML = `<button class="action-btn" id="next-btn">Siguiente caso →</button>`;
    document.getElementById("next-btn").addEventListener("click", nextCase);
  } else if (reveal) {
    // Intentos agotados: recién aquí se muestra el razonamiento técnico completo.
    feedback.innerHTML = `
      <div class="card error">
        <strong>Incorrecto</strong>
        <p>${activeCase.feedback}</p>
      </div>
      ${interNote}
    `;
    actions.innerHTML = `<button class="action-btn" id="next-btn">Siguiente caso →</button>`;
    document.getElementById("next-btn").addEventListener("click", nextCase);
  } else {
    // Error dentro del margen de intentos: sin pista ni explicación, solo invitación a reintentar.
    feedback.innerHTML = `
      <div class="card error">
        <strong>Incorrecto</strong>
        <p>Inténtalo de nuevo. Te queda${attemptsLeft === 1 ? "" : "n"} ${attemptsLeft} intento${attemptsLeft === 1 ? "" : "s"} antes de ver la explicación.</p>
      </div>
    `;
    actions.innerHTML = `<button class="action-btn secondary" id="retry-btn">Reintentar</button>`;
    document.getElementById("retry-btn").addEventListener("click", retryAnswer);
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
  st.lastAttemptDate = st.history[st.history.length - 1].date;
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

function renderSimulacro() {
  if (simulacroPhase === "running" && simulacroQueue.length) {
    if (!simulacroTimerId) {
      simulacroTimerId = setInterval(() => {
        simulacroTimeLeft -= 1;
        if (simulacroTimeLeft <= 0) {
          simulacroTimeLeft = 0;
          clearInterval(simulacroTimerId);
          finishSimulacro();
          return;
        }
        updateSimulacroTimerDisplay();
      }, 1000);
    }
    return renderSimulacroRunning();
  }
  if (simulacroPhase === "finished") return renderSimulacroResults();
  renderSimulacroIntro();
}

function renderSimulacroIntro() {
  pageTitle.textContent = "Simulacro SERUMS";
  pageSubtitle.textContent = "100 preguntas, 5 bloques oficiales, cronómetro y puntaje final.";

  const totalAvailable = data.cases.length;
  const target = Math.min(SIMULACRO_TARGET, totalAvailable);
  const lastAttempts = simulacroHistory.slice(-5).reverse();
  const careers = [...new Set(data.cases.map(c => c.career || c.specialty))].filter(c => c !== "Transversal").sort();

  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Cómo funciona</h3>
        <label style="display:block;margin-bottom:10px;color:#5B6E6A;font-size:13px">
          Carrera del simulacro
          <select id="simulacro-career-select" class="search" style="margin-top:4px">
            <option value="">Todas las carreras (modo mixto)</option>
            ${careers.map(c => `<option value="${c}" ${simulacroCareer === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </label>
        <ul style="margin:0;padding-left:18px;color:#5B6E6A;line-height:1.7">
          <li>${target} preguntas seleccionadas al azar, repartidas entre los 5 bloques oficiales SERUMS según la proporción real observada en exámenes anteriores (mayor peso en Gestión y Salud Pública).</li>
          <li>Si eliges una carrera, los casos clínicos propios de otras profesiones no aparecen — igual que el examen real, que es específico por profesión.</li>
          <li>Se evitan repetir las preguntas de tus últimos 2 intentos, siempre que haya suficientes casos alternativos disponibles.</li>
          <li>Cronómetro total de ${Math.round(target * SIMULACRO_SECONDS_PER_Q / 60)} minutos (ritmo de referencia de 1 min/pregunta).</li>
          <li>Una sola oportunidad de respuesta por pregunta, sin reintentos — igual que el examen real.</li>
          <li>Sin penalización por error: cada acierto suma un punto.</li>
        </ul>
        <button class="action-btn" id="start-simulacro-btn">Iniciar simulacro →</button>
      </div>
      <div class="panel">
        <h3 class="section-title">Tus últimos intentos</h3>
        ${lastAttempts.length ? `
          <div class="progress-list">
            ${lastAttempts.map(a => `
              <div>
                <div class="progress-head"><span>${new Date(a.date).toLocaleDateString("es-PE")}${a.career ? " · " + a.career : ""}</span><span>${a.correctCount}/${a.total} · ${a.pct}%</span></div>
                <div class="bar"><span style="width:${a.pct}%"></span></div>
              </div>
            `).join("")}
          </div>
        ` : `<p style="color:#5B6E6A">Aún no rindes ningún simulacro.</p>`}
      </div>
    </section>
  `;

  document.getElementById("simulacro-career-select").addEventListener("change", e => {
    simulacroCareer = e.target.value;
    localStorage.setItem("simulacroCareer", simulacroCareer);
  });
  document.getElementById("start-simulacro-btn").addEventListener("click", startSimulacro);
}

function startSimulacro() {
  simulacroQueue = buildSimulacroQueue(simulacroCareer);
  simulacroIndex = 0;
  simulacroResults = [];
  simulacroSelected = null;
  simulacroConfirmed = false;
  simulacroTimeLeft = simulacroQueue.length * SIMULACRO_SECONDS_PER_Q;
  simulacroPhase = "running";

  clearInterval(simulacroTimerId);
  simulacroTimerId = setInterval(() => {
    simulacroTimeLeft -= 1;
    if (simulacroTimeLeft <= 0) {
      simulacroTimeLeft = 0;
      clearInterval(simulacroTimerId);
      finishSimulacro();
      return;
    }
    updateSimulacroTimerDisplay();
  }, 1000);

  renderSimulacroRunning();
}

function updateSimulacroTimerDisplay() {
  const el = document.getElementById("simulacro-timer");
  if (!el) return;
  const m = Math.floor(simulacroTimeLeft / 60);
  const s = simulacroTimeLeft % 60;
  el.textContent = `${m}:${String(s).padStart(2, "0")}`;
}

function renderSimulacroRunning() {
  pageTitle.textContent = `Simulacro · Pregunta ${simulacroIndex + 1} de ${simulacroQueue.length}`;
  pageSubtitle.textContent = "Responde con calma; no hay reintentos en este modo.";

  const c = simulacroQueue[simulacroIndex];
  const pct = fmtPct(Math.round((simulacroIndex / simulacroQueue.length) * 100));

  const optionsHtml = c.options.map((o, i) => {
    let cls = "option-btn";
    if (simulacroConfirmed) {
      if (i === c.correct) cls += " success";
      else if (i === simulacroSelected) cls += " error";
    } else if (i === simulacroSelected) {
      cls += " selected";
    }
    return `<button class="${cls}" data-opt="${i}" ${simulacroConfirmed ? "disabled" : ""}>${String.fromCharCode(65 + i)}. ${o}</button>`;
  }).join("");

  root.innerHTML = `
    <section class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span class="badge">${c.career || c.specialty} · ${c.block}</span>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge" id="simulacro-timer" style="background:#F1E9D8;color:#8A6D3B">--:--</span>
          <button class="action-btn secondary" id="finish-early-btn" style="margin:0;padding:6px 10px;font-size:12px">Finalizar ahora</button>
        </div>
      </div>
      <div class="bar" style="margin-bottom:14px"><span style="width:${pct}%"></span></div>
      <h3 class="section-title">${c.title}</h3>
      <p>${c.statement}</p>
      <p><strong>${c.question}</strong></p>
      <div class="option-list">${optionsHtml}</div>
      <div id="simulacro-feedback" style="margin-top:12px"></div>
      <div id="simulacro-actions" style="margin-top:12px"></div>
    </section>
  `;

  updateSimulacroTimerDisplay();

  document.getElementById("finish-early-btn").addEventListener("click", () => {
    const answered = simulacroResults.length;
    if (confirm(`Llevas ${answered} de ${simulacroQueue.length} preguntas respondidas. ¿Finalizar el simulacro ahora con ese avance?`)) {
      clearInterval(simulacroTimerId);
      finishSimulacro();
    }
  });

  root.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (simulacroConfirmed) return;
      simulacroSelected = Number(btn.dataset.opt);
      renderSimulacroRunning();
    });
  });

  const actions = document.getElementById("simulacro-actions");
  const feedback = document.getElementById("simulacro-feedback");

  if (!simulacroConfirmed) {
    actions.innerHTML = `<button class="action-btn" id="confirm-sim-btn" ${simulacroSelected === null ? "disabled" : ""}>Confirmar respuesta</button>`;
    document.getElementById("confirm-sim-btn").addEventListener("click", confirmSimulacroAnswer);
  } else {
    const correct = simulacroSelected === c.correct;
    feedback.innerHTML = `
      <div class="card ${correct ? "success" : "error"}">
        <strong>${correct ? "Correcto" : "Incorrecto"}</strong>
        <p>${c.feedback}</p>
      </div>
    `;
    const isLast = simulacroIndex === simulacroQueue.length - 1;
    actions.innerHTML = `<button class="action-btn" id="next-sim-btn">${isLast ? "Ver resultados →" : "Siguiente pregunta →"}</button>`;
    document.getElementById("next-sim-btn").addEventListener("click", nextSimulacroQuestion);
  }
}

function confirmSimulacroAnswer() {
  if (simulacroSelected === null || simulacroConfirmed) return;
  simulacroConfirmed = true;
  const c = simulacroQueue[simulacroIndex];
  const correct = simulacroSelected === c.correct;
  simulacroResults.push({ caseId: c.id, career: c.career || c.specialty, block: c.block, correct });
  renderSimulacroRunning();
}

function nextSimulacroQuestion() {
  if (simulacroIndex < simulacroQueue.length - 1) {
    simulacroIndex += 1;
    simulacroSelected = null;
    simulacroConfirmed = false;
    renderSimulacroRunning();
  } else {
    clearInterval(simulacroTimerId);
    finishSimulacro();
  }
}

function finishSimulacro() {
  simulacroPhase = "finished";
  const total = simulacroResults.length; // preguntas efectivamente respondidas (permite cierre anticipado)
  const correctCount = simulacroResults.filter(r => r.correct).length;
  const pct = total ? fmtPct(Math.round((correctCount / total) * 100)) : 0;

  const byBlock = {};
  simulacroResults.forEach(r => {
    byBlock[r.block] = byBlock[r.block] || { correct: 0, total: 0 };
    byBlock[r.block].total += 1;
    if (r.correct) byBlock[r.block].correct += 1;
  });

  const record = {
    date: new Date().toISOString(),
    total,
    correctCount,
    pct,
    byBlock,
    career: simulacroCareer || null,
    caseIds: simulacroResults.map(r => r.caseId)
  };
  simulacroHistory.push(record);
  saveProgress("simulacroHistory", simulacroHistory);

  renderSimulacroResults();
}

function renderSimulacroResults() {
  pageTitle.textContent = "Resultados del simulacro";
  pageSubtitle.textContent = "Resumen de tu último intento.";

  const last = simulacroHistory[simulacroHistory.length - 1];
  if (!last) { simulacroPhase = "intro"; return renderSimulacroIntro(); }

  const savedName = localStorage.getItem("preserum_userName") || "";

  root.innerHTML = `
    <section class="grid metrics">
      <div class="card"><span class="label">Puntaje</span><div class="value">${last.correctCount}/${last.total}</div></div>
      <div class="card"><span class="label">Porcentaje</span><div class="value">${last.pct}%</div></div>
      <div class="card"><span class="label">Fecha</span><div class="value" style="font-size:18px">${new Date(last.date).toLocaleDateString("es-PE")}</div></div>
    </section>
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Desglose por bloque oficial</h3>
        <div class="progress-list">
          ${Object.entries(last.byBlock).map(([block, v]) => {
            const p = v.total ? fmtPct(Math.round((v.correct / v.total) * 100)) : 0;
            return `
              <div>
                <div class="progress-head"><span>${block}</span><span>${v.correct}/${v.total} · ${p}%</span></div>
                <div class="bar"><span style="width:${p}%"></span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <div class="panel">
        <h3 class="section-title">Exportar constancia</h3>
        <p style="color:#5B6E6A;line-height:1.6;margin-bottom:10px">Genera un PDF de este resultado para guardar o compartir. Tu nombre queda guardado en este dispositivo para tus próximas constancias.</p>
        <input id="export-name" class="search" placeholder="Tu nombre (opcional)" value="${savedName}" style="margin-bottom:10px" />
        <button class="action-btn" id="export-pdf-btn">Descargar constancia (PDF)</button>
        <p style="color:#5B6E6A;font-size:12px;margin-top:8px">Se abrirá el diálogo de impresión de tu navegador; elige "Guardar como PDF".</p>
      </div>
    </section>
    <section style="margin-top:16px">
      <div class="panel">
        <h3 class="section-title">Siguiente paso</h3>
        <p style="color:#5B6E6A;line-height:1.6">Cada intento queda guardado en tu historial. Repite el simulacro cuando quieras: la selección de preguntas y su orden cambian cada vez.</p>
        <button class="action-btn" id="retry-simulacro-btn">Rendir otro simulacro</button>
      </div>
    </section>
  `;

  document.getElementById("export-pdf-btn").addEventListener("click", () => {
    const name = document.getElementById("export-name").value.trim();
    localStorage.setItem("preserum_userName", name);
    exportSimulacroPDF(last, name);
  });

  document.getElementById("retry-simulacro-btn").addEventListener("click", () => {
    simulacroPhase = "intro";
    renderSimulacroIntro();
  });
}

function exportSimulacroPDF(record, name) {
  const printRoot = document.getElementById("print-report");
  const blockRows = Object.entries(record.byBlock).map(([block, v]) => {
    const p = v.total ? Math.round((v.correct / v.total) * 100) : 0;
    return `<tr><td>${block}</td><td>${v.correct}/${v.total}</td><td>${p}%</td></tr>`;
  }).join("");

  printRoot.innerHTML = `
    <div class="print-page">
      <h1>PRE SERUMS PERÚ</h1>
      <h2>Constancia de Autoevaluación — Simulacro SERUMS</h2>
      <p class="print-meta">${name ? "Nombre: " + name + " · " : ""}Fecha: ${new Date(record.date).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</p>
      <div class="print-score">
        <div><span>Puntaje</span><strong>${record.correctCount} / ${record.total}</strong></div>
        <div><span>Porcentaje</span><strong>${record.pct}%</strong></div>
      </div>
      <h3>Desglose por bloque oficial</h3>
      <table class="print-table">
        <thead><tr><th>Bloque temático</th><th>Aciertos</th><th>%</th></tr></thead>
        <tbody>${blockRows}</tbody>
      </table>
      <p class="print-note">Este documento es una autoevaluación generada por la aplicación PRE SERUMS PERÚ con fines de estudio personal. No constituye un resultado oficial del proceso SERUMS ni un documento emitido por el MINSA.</p>
    </div>
  `;

  window.print();
}

function renderGlossary() {
  pageTitle.textContent = "Conceptos clave";
  pageSubtitle.textContent = "Repaso rápido de términos y definiciones frecuentes en la evaluación SERUMS.";

  root.innerHTML = `
    <section class="panel">
      <input id="glossary-search" class="search" placeholder="Buscar un término (ej. incidencia, PEI, FODA, VPN)..." />
      <div class="chips" id="glossary-chips" style="margin-bottom:16px"></div>
      <div id="glossary-list"></div>
    </section>
  `;

  const search = document.getElementById("glossary-search");
  const chipsBox = document.getElementById("glossary-chips");
  const list = document.getElementById("glossary-list");
  let activeCategory = "";

  chipsBox.innerHTML = data.glossary.map(g => `<span class="chip" data-cat="${g.category}" style="cursor:pointer">${g.category}</span>`).join("");
  chipsBox.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      activeCategory = activeCategory === chip.dataset.cat ? "" : chip.dataset.cat;
      chipsBox.querySelectorAll(".chip").forEach(c => c.style.outline = "");
      if (activeCategory) chip.style.outline = "2px solid var(--primary)";
      draw(search.value);
    });
  });

  function draw(filter = "") {
    const q = filter.toLowerCase();
    let html = "";
    data.glossary.forEach(g => {
      if (activeCategory && g.category !== activeCategory) return;
      const filtered = g.terms.filter(t =>
        !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
      );
      if (!filtered.length) return;
      html += `<h3 class="section-title" style="margin-top:18px">${g.category}</h3>`;
      html += `<div class="norm-list">`;
      filtered.forEach(t => {
        html += `
          <article class="norm-card">
            <h3 style="margin:0 0 6px;font-size:16px;color:var(--primary-dark)">${t.term}</h3>
            <p style="margin:0;color:#33403D">${t.definition}</p>
          </article>
        `;
      });
      html += `</div>`;
    });
    list.innerHTML = html || `<p style="color:#5B6E6A">No se encontraron términos con ese filtro.</p>`;
  }

  search.addEventListener("input", e => draw(e.target.value));
  draw();
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

function renderPriorityNorms() {
  pageTitle.textContent = "Normas prioritarias SERUMS 2026";
  pageSubtitle.textContent = "NTS y RM 2026 con mayor probabilidad de evaluación, organizadas por prioridad.";
  const order = ["muy alta", "alta", "media-alta", "media", "base obligatoria"];
  const grouped = order
    .map(p => ({ priority: p, items: data.priorityNorms2026.filter(n => n.priority === p) }))
    .filter(g => g.items.length);
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        ${grouped.map(g => `
          <h3 class="section-title" style="margin-top:18px;text-transform:capitalize">Prioridad ${g.priority}</h3>
          <div class="norm-list">
            ${g.items.map((n, i) => `
              <article class="norm-card">
                <span>${n.code}</span>
                <h3>${n.title}</h3>
                <p>${n.summary}</p>
                <button class="toggle" data-target="pnorm-${g.priority}-${i}">Ver detalle</button>
                <div class="toggle-panel" id="pnorm-${g.priority}-${i}">
                  <p>${n.detail}</p>
                  <p style="margin-top:8px;color:#5B6E6A"><strong>Bloque:</strong> ${n.block} &middot; <strong>Temas evaluables:</strong> ${n.topics.join(", ")}</p>
                </div>
              </article>
            `).join("")}
          </div>
        `).join("")}
      </div>
      <div class="panel">
        <h3 class="section-title">Sobre esta sección</h3>
        <p style="line-height:1.6;color:#5B6E6A">Normas técnicas y resoluciones ministeriales priorizadas para el proceso SERUMS 2026, verificadas en el portal MINSA y el Diario Oficial El Peruano. Las 15 preguntas derivadas de estas normas ya forman parte del banco de casos (bloques Gestión, Salud pública y Cuidado integral).</p>
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

// Base de Datos SERUMS: catálogo de exámenes reales del MINSA ya analizados,
// con los casos originales generados a partir de cada uno y el perfil de pesos
// por bloque usado en el Simulacro. No reproduce las preguntas reales (derechos
// de autor); es un registro de trazabilidad para saber qué ya se procesó y
// poder sumar nuevas carreras/exámenes sin perder este trabajo.
function renderExamRegistry() {
  pageTitle.textContent = "Base de Datos SERUMS";
  pageSubtitle.textContent = "Exámenes reales del MINSA ya analizados, y los casos originales generados a partir de ellos.";

  const registry = data.realExamRegistry || [];
  const byCareer = {};
  registry.forEach(r => {
    byCareer[r.career] = byCareer[r.career] || [];
    byCareer[r.career].push(r);
  });

  const weights = data.examBlockWeights || {};

  root.innerHTML = `
    <button id="back-to-dashboard-btn" class="toggle" style="margin-bottom:12px">← Volver al tablero</button>
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Exámenes reales analizados por carrera</h3>
        ${Object.keys(byCareer).length ? Object.entries(byCareer).map(([career, exams]) => `
          <div style="margin-bottom:18px">
            <h4 style="margin:0 0 8px 0">${career} <span style="color:#5B6E6A;font-weight:normal">(${exams.length} examen${exams.length !== 1 ? "es" : ""}, ${exams.reduce((s, e) => s + e.questionCount, 0)} preguntas revisadas)</span></h4>
            <div class="progress-list">
              ${exams.map(e => `
                <div class="card" style="margin-bottom:8px">
                  <strong>${e.examLabel}</strong>
                  <p style="margin:4px 0;color:#5B6E6A;font-size:13px">Fecha del examen: ${e.date} · Archivo fuente: ${e.sourceFile}</p>
                  <p style="margin:4px 0;color:#5B6E6A;font-size:13px">Analizado el ${e.analyzedDate} · ${e.gapsGeneratedIds.length} casos originales del banco derivados de este análisis</p>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("") : `<p style="color:#5B6E6A">Aún no se ha analizado ningún examen real.</p>`}
      </div>
      <div class="panel">
        <h3 class="section-title">Perfil de pesos usado en el Simulacro</h3>
        <p style="color:#5B6E6A;font-size:13px;margin-bottom:12px">Calculado a partir de la lectura manual de los exámenes reales registrados (aproximación, no conteo automatizado). Se usa para que el Simulacro reparta las preguntas según la proporción real observada, en vez de un reparto uniforme entre bloques.</p>
        <div class="progress-list">
          ${Object.entries(weights).map(([block, w]) => `
            <div>
              <div class="progress-head"><span>${block}</span><span>${Math.round(w * 100)}%</span></div>
              <div class="bar"><span style="width:${Math.round(w * 100)}%"></span></div>
            </div>
          `).join("")}
        </div>
        <p style="margin-top:16px;color:#5B6E6A;font-size:13px">Por derechos de autor, este registro no guarda las preguntas literales de los exámenes reales — solo su metadata y los casos <strong>originales</strong> redactados a partir del análisis de sus temas y nivel de dificultad.</p>
      </div>
    </section>
  `;

  document.getElementById("back-to-dashboard-btn").addEventListener("click", () => renderView("dashboard"));
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
  if (view !== "simulacro") {
    clearInterval(simulacroTimerId);
    simulacroTimerId = null;
  }
  if (view === "dashboard") renderDashboard();
  if (view === "cases") renderCases();
  if (view === "simulacro") renderSimulacro();
  if (view === "glossary") renderGlossary();
  if (view === "norms") renderNorms();
  if (view === "priorityNorms") renderPriorityNorms();
  if (view === "decrees") renderDecrees();
  if (view === "resources") renderResources();
  if (view === "examRegistry") renderExamRegistry();
  setActive(view);
  updateBadges();
}

navButtons.forEach(btn => btn.addEventListener("click", () => {
  priorityReviewMode = false;
  renderView(btn.dataset.view);
}));
renderView("dashboard");
