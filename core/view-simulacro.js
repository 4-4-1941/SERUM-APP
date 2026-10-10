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
  pageSubtitle.textContent = "Examen transversal: 100 preguntas de todas las carreras y los 5 bloques temáticos oficiales, con cronómetro y puntaje final.";

  const totalAvailable = data.cases.length;
  const target = Math.min(SIMULACRO_TARGET, totalAvailable);
  const lastAttempts = simulacroHistory.slice(-5).reverse();
  let careers = [...new Set(data.cases.map(c => c.career || c.specialty))].filter(c => c !== "Transversal").sort();
  const careerOptions = () => `<option value="">Examen transversal: todas las carreras, todos los bloques</option>${careers.map(c => `<option value="${c}" ${simulacroCareer === c ? "selected" : ""}>Práctica por carrera: ${c}</option>`).join("")}`;

  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Cómo funciona</h3>
        <label style="display:block;margin-bottom:10px;color:#5B6E6A;font-size:13px">
          Modalidad del simulacro
          <select id="simulacro-career-select" class="search" style="margin-top:4px">
            ${careerOptions()}
          </select>
        </label>
        <ul style="margin:0;padding-left:18px;color:#5B6E6A;line-height:1.7">
          <li>${target} preguntas seleccionadas al azar, repartidas entre los 5 bloques oficiales SERUMS según la proporción real observada en exámenes anteriores (mayor peso en Gestión y Salud Pública).</li>
          <li>El examen real es transversal: reúne preguntas de todas las carreras y de todos los bloques. Esa es la modalidad predeterminada. Si prefieres practicar por tu carrera, elígela en la lista: se omiten los casos clínicos propios de otras profesiones y los demás bloques siguen siendo transversales.</li>
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
                <div class="progress-head"><span>${new Date(a.date).toLocaleDateString("es-PE")}${a.career ? " · Práctica: " + a.career : " · Transversal"}</span><span>${a.correctCount}/${a.total} · ${a.pct}%</span></div>
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
      if (select) select.innerHTML = careerOptions();
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
    if (i === simulacroSelected) {
      cls += " selected";
    }
    return `<button class="${cls}" data-opt="${i}" ${simulacroConfirmed ? "disabled" : ""}>${String.fromCharCode(65 + i)}. ${o}</button>`;
  }).join("");

  const answerBubbles = c.options.map((_, i) => {
    const letter = String.fromCharCode(65 + i);
    return `<button type="button" class="answer-bubble${simulacroSelected === i ? " selected" : ""}" data-opt="${i}" aria-pressed="${simulacroSelected === i}" aria-label="Marcar alternativa ${letter}" ${simulacroConfirmed ? "disabled" : ""}><span>${letter}</span></button>`;
  }).join("");

  root.innerHTML = `
    <section class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span class="badge">${(c.career || c.specialty)} · ${c.block}</span>
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
      <div class="current-answer-sheet" aria-label="Fila óptica de la pregunta actual">
        <div class="optical-row-number"><span>Pregunta</span><strong>${simulacroIndex + 1}</strong></div>
        <div class="answer-bubbles">${answerBubbles}</div>
        <span>${simulacroSelected === null ? "Sin marcar" : `Respuesta reflejada: ${String.fromCharCode(65 + simulacroSelected)}`}</span>
      </div>
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

  root.querySelectorAll(".answer-bubble").forEach(btn => {
    btn.addEventListener("click", () => {
      if (simulacroConfirmed) return;
      simulacroSelected = Number(btn.dataset.opt);
      renderSimulacroRunning();
    });
  });

  const actions = document.getElementById("simulacro-actions");

  // Un solo botón: registra la respuesta y pasa a la siguiente pregunta.
  const isLast = simulacroIndex === simulacroQueue.length - 1;
  actions.innerHTML = `<button class="action-btn" id="confirm-sim-btn" ${simulacroSelected === null ? "disabled" : ""}>${isLast ? "Confirmar y ver resultados →" : "Confirmar y siguiente →"}</button>
    <p style="color:#5B6E6A;font-size:12px;margin-top:8px">Puedes cambiar la alternativa hasta que toques este botón. El resultado se muestra al finalizar.</p>`;
  document.getElementById("confirm-sim-btn").addEventListener("click", confirmSimulacroAnswer);
}

function confirmSimulacroAnswer() {
  if (simulacroSelected === null || simulacroConfirmed) return;
  const c = simulacroQueue[simulacroIndex];
  const correct = simulacroSelected === c.correct;
  simulacroResults.push({
    questionIndex: simulacroIndex,
    caseId: c.id,
    career: c.career || c.specialty,
    block: c.block,
    selected: simulacroSelected,
    correctOption: c.correct,
    correct
  });
  nextSimulacroQuestion();
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
  if (simulacroPhase === "finished") return;
  clearInterval(simulacroTimerId);
  simulacroPhase = "finished";
  const total = simulacroQueue.length;
  const answeredCount = simulacroResults.length;
  const correctCount = simulacroResults.filter(r => r.correct).length;
  const pct = total ? fmtPct(Math.round((correctCount / total) * 100)) : 0;

  const byBlock = {};
  const resultByIndex = new Map(simulacroResults.map(r => [r.questionIndex, r]));
  simulacroQueue.forEach((question, index) => {
    const block = question.block;
    const result = resultByIndex.get(index);
    byBlock[block] = byBlock[block] || { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
    byBlock[block].total += 1;
    if (!result) byBlock[block].unanswered += 1;
    else if (result.correct) byBlock[block].correct += 1;
    else byBlock[block].incorrect += 1;
  });

  const record = {
    date: new Date().toISOString(),
    total,
    answeredCount,
    correctCount,
    pct,
    byBlock,
    career: simulacroCareer || null,
    caseIds: simulacroQueue.map(q => q.id),
    answers: simulacroQueue.map((q, questionIndex) => {
      const result = resultByIndex.get(questionIndex);
      return {
        questionIndex,
        caseId: q.id,
        block: q.block,
        title: q.title,
        question: q.question,
        options: [...q.options],
        selected: result ? result.selected : null,
        correctOption: q.correct,
        selectedLetter: result ? String.fromCharCode(65 + result.selected) : null,
        correctLetter: String.fromCharCode(65 + q.correct),
        feedback: q.feedback || "",
        correct: result ? result.correct : false,
        unanswered: !result
      };
    })
  };
  simulacroHistory.push(record);
  saveProgress("simulacroHistory", simulacroHistory);

  renderSimulacroResults();
}

function renderOutcomeChart(correct, incorrect, unanswered, total) {
  const safeTotal = Math.max(1, total);
  const correctPct = Math.round((correct / safeTotal) * 100);
  const incorrectPct = Math.round((incorrect / safeTotal) * 100);
  const unansweredPct = Math.max(0, 100 - correctPct - incorrectPct);
  const secondStop = correctPct + incorrectPct;
  return `<div class="outcome-chart" role="img" aria-label="Distribución: ${correct} correctas, ${incorrect} incorrectas y ${unanswered} no marcadas de ${total} preguntas">
    <div class="outcome-donut" style="--correct-stop:${correctPct}%;--incorrect-stop:${secondStop}%"><div><strong>${correctPct}%</strong><span>Acierto</span></div></div>
    <div class="chart-legend">
      <span><i class="chart-correct"></i><b>Correctas</b><em>${correct} · ${correctPct}%</em></span>
      <span><i class="chart-incorrect"></i><b>Incorrectas</b><em>${incorrect} · ${incorrectPct}%</em></span>
      <span><i class="chart-unanswered"></i><b>No marcadas</b><em>${unanswered} · ${unansweredPct}%</em></span>
    </div>
  </div>`;
}

function renderBlockChart(byBlock) {
  return Object.entries(byBlock).map(([block, value]) => {
    const pct = value.total ? Math.round((value.correct / value.total) * 100) : 0;
    return `<div class="axis-bar-row">
      <div class="axis-bar-label"><span>${block}</span><strong>${pct}%</strong></div>
      <div class="axis-bar-track" role="img" aria-label="${block}: ${value.correct} de ${value.total} correctas, ${pct}%"><span style="width:${pct}%"></span></div>
      <small>${value.correct} correctas · ${value.incorrect || 0} incorrectas · ${value.unanswered || 0} no marcadas · total ${value.total}</small>
    </div>`;
  }).join("");
}

function renderHistoryChart(history) {
  const attempts = history.slice(-8);
  if (!attempts.length) return "";
  const width = 560, height = 190, left = 42, right = 18, top = 18, bottom = 34;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const step = attempts.length > 1 ? plotWidth / (attempts.length - 1) : 0;
  const points = attempts.map((attempt, index) => ({
    x: attempts.length > 1 ? left + index * step : left + plotWidth / 2,
    y: top + plotHeight - (Number(attempt.pct) || 0) / 100 * plotHeight,
    pct: Number(attempt.pct) || 0,
    label: history.length - attempts.length + index + 1
  }));
  const polyline = points.map(point => `${point.x},${point.y}`).join(" ");
  const guides = [0, 25, 50, 75, 100].map(value => {
    const y = top + plotHeight - value / 100 * plotHeight;
    return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="trend-guide"/><text x="${left - 8}" y="${y + 4}" text-anchor="end">${value}%</text>`;
  }).join("");
  const marks = points.map(point => `<g><circle cx="${point.x}" cy="${point.y}" r="5"/><text class="trend-value" x="${point.x}" y="${point.y - 10}" text-anchor="middle">${point.pct}%</text><text x="${point.x}" y="${height - 10}" text-anchor="middle">I${point.label}</text></g>`).join("");
  return `<svg class="history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolución del porcentaje en los últimos ${attempts.length} intentos">${guides}${attempts.length > 1 ? `<polyline points="${polyline}"/>` : ""}${marks}</svg>
    <p class="chart-caption">Últimos ${attempts.length} intento${attempts.length === 1 ? "" : "s"}. Cada porcentaje usa como denominador el total generado.</p>`;
}

function renderSimulacroResults() {
  pageTitle.textContent = "Resultados del simulacro";
  pageSubtitle.textContent = "Resumen de tu último intento.";

  const last = simulacroHistory[simulacroHistory.length - 1];
  if (!last) { simulacroPhase = "intro"; return renderSimulacroIntro(); }

  const savedName = localStorage.getItem("preserum_userName") || "";
  const answers = Array.isArray(last.answers) && last.answers.length
    ? last.answers
    : simulacroQueue.map((q, questionIndex) => {
        const r = simulacroResults.find(item => item.questionIndex === questionIndex);
        return { questionIndex, caseId: q.id, block: q.block, title: q.title, question: q.question, options: [...q.options], selected: r?.selected ?? null, correctOption: q.correct, selectedLetter: r ? String.fromCharCode(65 + r.selected) : null, correctLetter: String.fromCharCode(65 + q.correct), feedback: q.feedback || "", correct: Boolean(r?.correct), unanswered: !r };
      });
  const answerSheet = answers.map((answer, i) => {
    const status = answer.unanswered ? "unanswered" : (answer.correct ? "correct" : "incorrect");
    const label = answer.unanswered ? "No marcada" : (answer.correct ? "Correcta" : "Incorrecta");
    return `<button type="button" class="final-answer ${status}" data-review-index="${i}" aria-label="Revisar pregunta ${i + 1}: ${label}"><strong>${String(i + 1).padStart(2, "0")}</strong><span>${answer.selectedLetter || "—"}</span><small>${label}</small></button>`;
  }).join("");
  const answeredCount = last.answeredCount ?? simulacroResults.length;
  const unansweredCount = Math.max(0, last.total - answeredCount);
  const incorrectCount = Math.max(0, answeredCount - last.correctCount);
  const sampleNote = value => { const n = (value.correct || 0) + (value.incorrect || 0); return n < 5 ? " · muestra muy pequeña" : (n < 10 ? " · muestra pequeña" : ""); };
  const blockPerformance = Object.entries(last.byBlock).map(([block, value]) => ({ block, pct: value.total ? Math.round((value.correct / value.total) * 100) : 0, note: sampleNote(value) }));
  const strengths = blockPerformance.filter(item => item.pct >= 70);
  const developing = blockPerformance.filter(item => item.pct >= 60 && item.pct < 70);
  const weaknesses = blockPerformance.filter(item => item.pct < 60);
  const outcomeChart = renderOutcomeChart(last.correctCount, incorrectCount, unansweredCount, last.total);
  const blockChart = renderBlockChart(last.byBlock);
  const historyChart = renderHistoryChart(simulacroHistory);

  root.innerHTML = `
    <section class="grid metrics">
      <div class="card"><span class="label">Puntaje</span><div class="value">${last.correctCount}/${last.total}</div></div>
      <div class="card"><span class="label">Porcentaje</span><div class="value">${last.pct}%</div></div>
      <div class="card"><span class="label">Incorrectas</span><div class="value">${incorrectCount}</div></div>
      <div class="card"><span class="label">No marcadas</span><div class="value">${unansweredCount}</div></div>
      <div class="card"><span class="label">Precisión sobre respondidas</span><div class="value">${answeredCount ? Math.round((last.correctCount / answeredCount) * 100) : 0}%</div></div>
      <div class="card"><span class="label">Fecha</span><div class="value" style="font-size:18px">${new Date(last.date).toLocaleDateString("es-PE")}</div></div>
    </section>
    <section class="simulacro-charts" aria-label="Estadísticas visuales del simulacro">
      <article class="panel chart-panel">
        <h3 class="section-title">Distribución del resultado</h3>
        <p class="chart-subtitle">Composición de las ${last.total} preguntas generadas.</p>
        ${outcomeChart}
      </article>
      <article class="panel chart-panel">
        <h3 class="section-title">Rendimiento por eje temático</h3>
        <p class="chart-subtitle">Porcentaje de aciertos sobre el total de cada eje.</p>
        <div class="axis-bars">${blockChart}</div>
      </article>
      <article class="panel chart-panel chart-panel-wide">
        <h3 class="section-title">Evolución entre intentos</h3>
        <p class="chart-subtitle">Comparación de hasta ocho simulacros guardados en este dispositivo.</p>
        ${historyChart}
      </article>
    </section>
    <section class="panel final-answer-sheet">
      <div class="simulacro-kicker">RESUMEN FINAL</div>
      <h3 class="section-title">Hoja de respuestas del simulacro</h3>
      <p class="simulacro-note">Revisa las respuestas registradas. La clasificación de aciertos y errores se muestra únicamente al finalizar.</p>
      <div class="final-answer-grid">${answerSheet}</div>
      <div class="final-answer-legend"><span><i class="correct"></i>Correcta</span><span><i class="incorrect"></i>Incorrecta</span><span><i class="unanswered"></i>No marcada</span></div>
      <div id="simulacro-review-detail" class="simulacro-review-detail" aria-live="polite">Selecciona una fila para revisar la clave y la explicación.</div>
    </section>
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Desglose por bloque oficial</h3>
        <div class="progress-list">
          ${Object.entries(last.byBlock).map(([block, v]) => {
            const p = v.total ? fmtPct(Math.round((v.correct / v.total) * 100)) : 0;
            return `
              <div>
                <div class="progress-head"><span>${block}</span><span>${v.correct} correctas · ${v.incorrect || 0} incorrectas · ${v.unanswered || 0} no marcadas · ${p}%</span></div>
                <div class="bar"><span style="width:${p}%"></span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <div class="panel learning-summary">
        <h3 class="section-title">Lectura pedagógica del desempeño</h3>
        <p><strong>Fortalezas:</strong> ${strengths.length ? strengths.map(item => `${item.block} (${item.pct}%${item.note})`).join(", ") : "Aún no hay un bloque por encima del 70%."}</p>
        <p><strong>En progreso:</strong> ${developing.length ? developing.map(item => `${item.block} (${item.pct}%${item.note})`).join(", ") : "Ninguno en el rango intermedio."}</p>
        <p><strong>Prioriza reforzar:</strong> ${weaknesses.length ? weaknesses.map(item => `${item.block} (${item.pct}%${item.note})`).join(", ") : "Ningún bloque por debajo del 60%."}</p>
        <small>Referencia pedagógica interna: fortaleza ≥70%, en progreso 60–69% y reforzar &lt;60%. No es una clasificación oficial del MINSA.</small>
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

  root.querySelectorAll(".final-answer").forEach(button => {
    button.addEventListener("click", () => {
      const answer = answers[Number(button.dataset.reviewIndex)];
      const selectedText = answer.selected === null || answer.selected === undefined ? "No marcada" : `${answer.selectedLetter}. ${answer.options?.[answer.selected] || ""}`;
      const correctText = `${answer.correctLetter || String.fromCharCode(65 + answer.correctOption)}. ${answer.options?.[answer.correctOption] || ""}`;
      document.getElementById("simulacro-review-detail").innerHTML = `
        <strong>Pregunta ${answer.questionIndex + 1}: ${answer.title || "Revisión"}</strong>
        <p>${answer.question || ""}</p>
        <p><b>Tu respuesta:</b> ${selectedText}</p>
        <p><b>Clave:</b> ${correctText}</p>
        <p><b>Explicación:</b> ${answer.feedback || "Sin explicación registrada."}</p>
      `;
    });
  });

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
    return `<tr><td>${block}</td><td>${v.correct}</td><td>${v.incorrect || 0}</td><td>${v.unanswered || 0}</td><td>${v.total}</td><td>${p}%</td></tr>`;
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
        <thead><tr><th>Bloque temático</th><th>Aciertos</th><th>Errores</th><th>Omitidas</th><th>Total</th><th>%</th></tr></thead>
        <tbody>${blockRows}</tbody>
      </table>
      <p class="print-note">Este documento es una autoevaluación generada por la aplicación PRE SERUMS PERÚ con fines de estudio personal. No constituye un resultado oficial del proceso SERUMS ni un documento emitido por el MINSA.</p>
    </div>
  `;

  window.print();
}
