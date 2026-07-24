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
      const unverifiedTag = c.unverified
        ? `<span class="badge" style="background:#FFF3CD;color:#8A6D1D;margin-left:6px">⚠ Clave sin verificar</span>`
        : "";
      const cardStyle = c.unverified ? ' style="background:#FFFBF0;border-left:4px solid #E9B949"' : "";
      return `
        <button class="case-card" data-id="${c.id}"${cardStyle}>
          <span>${c.career || c.specialty} · ${c.block} · ${c.level}</span>
          <strong>${c.title}</strong>
          <small>${c.statement}</small>
          ${statusTag}${unverifiedTag}
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
    <div class="badge">${activeCase.career || activeCase.specialty} · ${activeCase.blo
