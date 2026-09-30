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
        <p id="bank-load-status" style="margin:10px 0;color:#5B6E6A;font-size:13px">Banco ampliado: cargando catálogo por profesión…</p>

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

  // Agregar listener al botón priority-toggle
  document.getElementById("priority-toggle").addEventListener("click", () => {
    priorityReviewMode = !priorityReviewMode;
    renderCases();
  });

  // VALIDAR que los elementos existen ANTES de usarlos
  const list = document.getElementById("case-list");
  const search = document.getElementById("case-search");
  const careerList = document.getElementById("career-list");
  const blockList = document.getElementById("block-list");
  const levelList = document.getElementById("level-list");
  const bankLoadStatus = document.getElementById("bank-load-status");

  // DEBUG: Log en consola (visible en Chrome móvil)
  console.log("🔍 renderCases() ejecutado");
  console.log("   list:", list ? "✅" : "❌");
  console.log("   search:", search ? "✅" : "❌");
  console.log("   careerList:", careerList ? "✅" : "❌");
  console.log("   data.cases:", data.cases ? data.cases.length : "❌");

  // SI NO EXISTEN LOS ELEMENTOS, SALIR
  if (!list || !search || !careerList || !blockList || !levelList) {
    console.error("❌ ERROR: Faltan elementos del DOM. Recargando...");
    setTimeout(() => location.reload(), 1000);
    return;
  }

  // Extraer carreras, bloques, niveles ÚNICOS y ORDENADOS
  let careers = [...new Set(data.cases.map(c => c.career || c.specialty))].sort();
  let blocks = [...new Set(data.cases.map(c => c.block))].sort();
  let levels = [...new Set(data.cases.map(c => c.level))].sort();
  let remoteCareers = new Set();

  let selectedCareer = "";
  let selectedBlock = "";
  let selectedLevel = "";

  function scrollToCaseList({ collapseMobileFilters = false } = {}) {
    const isMobile = window.matchMedia("(max-width: 760px)").matches;

    if (collapseMobileFilters && isMobile) {
      document.querySelectorAll(".filter-box[open]").forEach(details => {
        details.open = false;
      });
    }

    requestAnimationFrame(() => {
      const listTop = list.getBoundingClientRect().top;
      if (listTop < 0 || listTop >= window.innerHeight) {
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

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

    // LISTENERS PARA CARRERAS
    careerList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        selectedCareer = selectedCareer === btn.dataset.career ? "" : btn.dataset.career;
        if (selectedCareer && remoteCareers.has(selectedCareer) && !window.SERUMS_BANK.isRemoteProfessionLoaded(selectedCareer)) {
          if (bankLoadStatus) bankLoadStatus.textContent = `Cargando preguntas de ${selectedCareer}…`;
          try {
            const result = await window.SERUMS_BANK.mergeRemoteProfession(selectedCareer, { target: data.cases });
            blocks = [...new Set(data.cases.map(c => c.block))].sort();
            levels = [...new Set(data.cases.map(c => c.level))].sort();
            renderFilters();
            if (bankLoadStatus) bankLoadStatus.textContent = `${result.added} preguntas de ${selectedCareer} disponibles. Las claves permanecen pendientes de revisión.`;
          } catch (error) {
            console.error("No se pudo cargar el banco remoto", error);
            if (bankLoadStatus) bankLoadStatus.textContent = "No se pudo cargar el banco ampliado. Se mantiene el material local.";
          }
        }
        draw(search.value);
        document.getElementById("filter-career").open = false;
        scrollToCaseList();
      });
    });

    // LISTENERS PARA BLOQUES
    blockList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedBlock = selectedBlock === btn.dataset.block ? "" : btn.dataset.block;
        draw(search.value);
        document.getElementById("filter-block").open = false;
        scrollToCaseList();
      });
    });

    // LISTENERS PARA NIVELES
    levelList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedLevel = selectedLevel === btn.dataset.level ? "" : btn.dataset.level;
        draw(search.value);
        document.getElementById("filter-level").open = false;
        scrollToCaseList();
      });
    });
  }

  function draw(filter = "") {
    try {
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
          openCase(btn.dataset.id);
          const panel = document.getElementById("case-panel");
          if (panel) setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        });
      });

      console.log(`🔎 Búsqueda: "${q}" → ${filtered.length} resultados`);
    } catch (error) {
      console.error("❌ Error en draw():", error);
      list.innerHTML = `<p style="color:red">Error al filtrar. Recargando...</p>`;
      setTimeout(() => location.reload(), 2000);
    }
  }

  // AGREGAR LISTENER AL INPUT DE BÚSQUEDA
  if (search) {
  search.placeholder = "Buscar desde 2 caracteres…";
  search.setAttribute("autocomplete", "off");

  search.addEventListener("input", (e) => {
    const termino = e.target.value.trim();

    // Campo vacío: vuelve a mostrar la lista normal.
    if (termino.length === 0) {
      draw("");
      return;
    }

    // No buscar todavía con un solo carácter.
    if (termino.length < 2) {
      draw("");
      return;
    }

    // Buscar desde 2 caracteres.
    draw(termino);
    scrollToCaseList({ collapseMobileFilters: true });
  });
  }

  // RENDERIZAR FILTROS Y DIBUJAR CASOS
  renderFilters();
  draw();
  if (window.SERUMS_BANK && typeof window.SERUMS_BANK.listRemoteProfessions === "function") {
    window.SERUMS_BANK.listRemoteProfessions()
      .then((remote) => {
        remoteCareers = new Set(remote.map(item => item.profession));
        careers = [...new Set([...careers, ...remoteCareers])].sort((first, second) => first.localeCompare(second, "es"));
        renderFilters();
        if (bankLoadStatus) bankLoadStatus.textContent = `Banco ampliado disponible: ${remote.reduce((total, item) => total + item.count, 0)} preguntas en ${remote.length} profesiones. Selecciona una carrera para cargarla.`;
      })
      .catch((error) => {
        console.error("No se pudo consultar el catálogo remoto", error);
        if (bankLoadStatus) bankLoadStatus.textContent = "Banco ampliado no disponible. La aplicación continúa con el material local.";
      });
  } else if (bankLoadStatus) {
    bankLoadStatus.textContent = "Banco ampliado no disponible. La aplicación continúa con el material local.";
  }
  console.log("✅ renderCases() completado");
}

function openCase(id) {
  const original = data.cases.find(c => String(c.id) === String(id));
  if (!original) return;
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
    ${activeCase.unverified ? `<div class="card" style="background:#FFF3CD;border-left:4px solid #E9B949;margin:10px 0;padding:8px 12px"><strong style="color:#8A6D1D">⚠ Clave de respuesta sin verificar</strong><p style="margin:4px 0 0;font-size:13px;color:#5B6E6A">Este caso proviene de un examen real subido, pero la respuesta correcta es un criterio técnico propio, no una clave oficial confirmada.</p></div>` : ""}
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
    // Intentos agotados: recién aquí se muestra el razonamiento técnico completo,
    // en un bloque separado del rótulo "Incorrecto" para no generar confusión.
    const correctLetter = String.fromCharCode(65 + activeCase.correct);
    const cleanedFeedback = activeCase.feedback
      .replace(/^\s*Es\s+correcta\s+porque\s*/i, "")
      .replace(/^\s*Correcta\s+porque\s*/i, "")
      .trim();
    const explanationText = cleanedFeedback.charAt(0).toLowerCase() + cleanedFeedback.slice(1);
    feedback.innerHTML = `
      <div class="card error">
        <strong>Incorrecto</strong>
      </div>
      <div class="card" style="margin-top:10px;background:#F7F5F2;border-left:4px solid #0C3B34">
        <p><strong>Es correcta la opción ${correctLetter}</strong>, porque ${explanationText}</p>
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
