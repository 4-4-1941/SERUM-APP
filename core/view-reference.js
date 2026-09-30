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
