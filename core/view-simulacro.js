function recentlyUsedCaseIds() {
  const recent = simulacroHistory.slice(-2);
  const ids = new Set();
  recent.forEach(r => (r.caseIds || []).forEach(id => ids.add(id)));
  return ids;
}

function orderPoolAvoidingRepeats(pool, usedIds) {
  const fresh = shuffle(pool.filter(c => !usedIds.has(c.id)));
  const repeated = shuffle(pool.filter(c => usedIds.has(c.id)));
  return fresh.concat(repeated);
}

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
  let careers = [...new Set(data.cases.map(c => c.career || c.specialty))].filter(c => c !== "Transversal").sort();

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
  if (window.SERUMS_BANK && typeof window.SERUMS_BANK.listRemoteProfessions === "function") {
    window.SERUMS_BANK.listRemoteProfessions().then((remote) => {
      careers = [...new Set([...careers, ...remote.map(item => item.profession)])].sort((first, second) => first.localeCompare(second, "es"));
      const select = document.getElementById("simulacro-career-select");
      if (select) select.innerHTML = `<option value="">Todas las carreras (modo mixto)</option>${careers.map(c => `<option value="${c}" ${simulacroCareer === c ? "selected" : ""}>${c}</option>`).join("")}`;
    }).catch((error) => console.error("No se pudo consultar el catálogo del simulacro", error));
  }
  document.getElementById("start-simulacro-btn").addEventListener("click", startSimulacro);
}

async function startSimulacro() {
  const startButton = document.getElementById("start-simulacro-btn");
  if (simulacroCareer && window.SERUMS_BANK && typeof window.SERUMS_BANK.listRemoteProfessions === "function") {
    try {
      const remote = await window.SERUMS_BANK.listRemoteProfessions();
      if (remote.some(item => item.profession === simulacroCareer) && !window.SERUMS_BANK.isRemoteProfessionLoaded(simulacroCareer)) {
        if (startButton) { startButton.disabled = true; startButton.textContent = `Cargando ${simulacroCareer}…`; }
        await window.SERUMS_BANK.mergeRemoteProfession(simulacroCareer, { target: data.cases });
      }
    } catch (error) {
      console.error("No se pudo cargar la profesión para el simulacro", error);
    } finally {
      if (startButton) { startButton.disabled = false; startButton.textContent = "Iniciar simulacro →"; }
    }
  }
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
