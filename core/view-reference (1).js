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

function fichaEsc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const FICHA_ESTADOS = {
  REVIEW_REQUIRED: { t: "Datos por confirmar", c: "ambar" },
  FUENTE_OFICIAL: { t: "Fuente oficial verificada", c: "verde" }
};

function fichaItems() {
  const F = (data.fichas || []);
  const B = (data.blueprint && data.blueprint.normas) || [];
  const usados = new Set();
  const items = F.map(f => {
    const bp = B.find(b => b.n === f.match);
    if (bp) usados.add(bp.n);
    return { ficha: f, code: f.code, title: f.title, eje: f.eje, rank: bp ? bp.p : 0, t: bp ? bp.t : [] };
  });
  B.forEach(b => {
    if (usados.has(b.n)) return;
    items.push({ ficha: null, code: b.n, title: "", eje: b.e, rank: b.p, t: b.t || [] });
  });
  items.sort((a, b) => (b.ficha ? 1 : 0) - (a.ficha ? 1 : 0) || b.rank - a.rank);
  return items;
}

function fichaTramos(l) {
  const tot = l.tramos.reduce((a, t) => a + t.w, 0);
  return `
    <div class="fi-line">
      <div class="fi-line-title">${fichaEsc(l.titulo)}</div>
      <div class="fi-bar">
        ${l.tramos.map(t => `<div class="fi-seg ${fichaEsc(t.c)}" style="flex:${t.w} 1 ${Math.round(t.w / tot * 100)}%"><b>${fichaEsc(t.t)}</b><small>${fichaEsc(t.s)}</small></div>`).join("")}
      </div>
      ${l.sellos && l.sellos.length ? `<div class="fi-seals">
        ${l.sellos.map(s => `<div class="fi-seal ${fichaEsc(s.c)}"><b>${fichaEsc(s.t)}</b><small>${fichaEsc(s.s)}</small></div>`).join("")}
      </div>` : ""}
      ${l.nota ? `<p class="fi-note">${fichaEsc(l.nota)}</p>` : ""}
    </div>`;
}

function fichaCuerpo(f, key) {
  return `
    <div class="fi-body">
      <p class="fi-vig"><b>Vigencia:</b> ${fichaEsc(f.vigencia)}</p>
      ${f.alerta ? `<div class="fi-alert">⚠️ ${fichaEsc(f.alerta)}</div>` : ""}
      ${f.linea ? fichaTramos(f.linea) : ""}
      <details class="fi-sec" open>
        <summary>1. Definiciones críticas</summary>
        <dl class="fi-defs">
          ${f.definiciones.map(d => `<dt>${fichaEsc(d[0])} <small>${fichaEsc(d[2])}</small></dt><dd>${fichaEsc(d[1])}</dd>`).join("")}
        </dl>
      </details>
      <details class="fi-sec">
        <summary>2. Plazos y parámetros</summary>
        ${f.plazos.map(g => `
          <h4 class="fi-sub">${fichaEsc(g.norma)}</h4>
          <div class="fi-table-wrap"><table class="fi-table"><thead><tr><th>Dato</th><th>Valor</th><th>Ref.</th></tr></thead><tbody>
            ${g.filas.map(r => `<tr><td data-l="Dato">${fichaEsc(r[0])}</td><td data-l="Valor"><b>${fichaEsc(r[1])}</b></td><td data-l="Ref.">${fichaEsc(r[2])}</td></tr>`).join("")}
          </tbody></table></div>`).join("")}
      </details>
      <details class="fi-sec">
        <summary>${fichaEsc(f.flujo_titulo || "3. Qué hacer en el establecimiento")}</summary>
        <ol class="fi-steps">${f.flujo.map(s => `<li>${fichaEsc(s)}</li>`).join("")}</ol>
        ${f.flujo_nota ? `<p class="fi-note">${fichaEsc(f.flujo_nota)}</p>` : ""}
      </details>
      <details class="fi-sec">
        <summary>4. Trampas frecuentes de examen</summary>
        <ul class="fi-traps">${f.trampas.map(s => `<li>${fichaEsc(s)}</li>`).join("")}</ul>
      </details>
      <details class="fi-sec">
        <summary>5. Practica: preguntas tipo SERUMS</summary>
        ${f.preguntas.map((q, qi) => `
          <div class="fi-q" data-key="${key}" data-q="${qi}">
            <p class="fi-q-text">${fichaEsc(q.q)}</p>
            ${q.o.map((o, oi) => `<button type="button" class="option-btn" data-o="${oi}"><b>${"ABCD"[oi]})</b> ${fichaEsc(o)}</button>`).join("")}
            <div class="fi-q-out" aria-live="polite"></div>
          </div>`).join("")}
      </details>
      <details class="fi-sec">
        <summary>6. Documento y pendientes</summary>
        <p class="fi-doc"><b>${fichaEsc(f.code)}</b><br>${fichaEsc(f.title)}<br><small>${fichaEsc(f.aprobada)}</small></p>
        <p class="fi-note">Ref. = página del documento oficial en PDF.</p>
        <ul class="fi-traps">${f.pendientes.map(s => `<li>${fichaEsc(s)}</li>`).join("")}</ul>
      </details>
      <p class="fi-foot">Material pedagógico, no sustituye la norma oficial. Trampas y preguntas: análisis propio, pendiente de revisión humana. © SIP SERUMS PERÚ</p>
    </div>`;
}

function fichaCard(it, i) {
  const f = it.ficha;
  return `
    <article class="norm-card fi-card${f ? " has-ficha" : ""}">
      <span>${fichaEsc(it.code)}</span>
      ${it.title ? `<h3>${fichaEsc(it.title)}</h3>` : ""}
      <div class="chips fi-chips">
        <span class="chip">${fichaEsc(it.eje)}</span>
        <span class="fi-badge ${f ? "verde" : "gris"}">${f ? "Ficha lista" : "Ficha en preparación"}</span>
      </div>
      ${!f && it.t && it.t.length ? `<div class="chips fi-topics">${it.t.slice(0, 6).map(t => `<span class="chip fi-topic">${fichaEsc(t)}</span>`).join("")}</div>` : ""}
      ${f ? `<button type="button" class="action-btn fi-open" data-i="${i}">Abrir ficha</button>` : ""}
    </article>`;
}

function fichaDetalle(it, i) {
  const f = it.ficha;
  const est = FICHA_ESTADOS[f.estado] || { t: f.estado, c: "gris" };
  return `
    <div class="fi-backbar"><button type="button" class="action-btn fi-back">← Volver a las fichas</button></div>
    <article class="norm-card fi-card has-ficha fi-detail">
      <span>${fichaEsc(it.code)}</span>
      <h3>${fichaEsc(it.title)}</h3>
      <div class="chips fi-chips">
        <span class="chip">${fichaEsc(it.eje)}</span>
        <span class="fi-badge ${est.c}">${fichaEsc(est.t)}</span>
      </div>
      <p class="fi-note">${fichaEsc(f.aprobada)}</p>
      ${fichaCuerpo(f, i)}
    </article>
    <button type="button" class="action-btn fi-back fi-back-bottom">← Volver a las fichas</button>`;
}

async function renderNorms() {
  const request = coreNavigationRequest;
  pageTitle.textContent = "Normativa SERUMS";
  pageSubtitle.textContent = "Fichas de estudio por norma: definiciones, plazos, trampas y preguntas tipo examen.";
  root.innerHTML = `<section class="panel"><p style="color:#5B6E6A">Cargando fichas…</p></section>`;
  try { await loadCoreScript("sip-data-fichas"); }
  catch (error) {
    if (request !== coreNavigationRequest) return;
    root.innerHTML = `<section class="panel"><p>No se pudieron cargar las fichas. <button type="button" class="action-btn" id="fi-retry">Reintentar</button></p></section>`;
    document.getElementById("fi-retry").addEventListener("click", renderNorms);
    return;
  }
  if (request !== coreNavigationRequest) return;

  const items = fichaItems();
  const ejes = Object.keys((data.blueprint && data.blueprint.ejes) || {});
  const nListas = items.filter(x => x.ficha).length;
  const nPrep = items.length - nListas;
  let modo = "listas";
  let eje = "";
  let scrollGuardado = 0;

  root.innerHTML = `
    <div id="fi-list-view">
      <section class="panel">
        <div class="fi-summary">
          <div><b>${nListas}</b><small>fichas listas</small></div>
          <div><b>${nPrep}</b><small>en preparación</small></div>
        </div>
        <input id="fi-search" class="search" placeholder="Buscar norma o tema (ej. dengue, historia clínica)..." />
        <div class="chips fi-filters" id="fi-modes" style="margin:12px 0 4px">
          <span class="chip fi-mode on" data-m="listas">Fichas listas (${nListas})</span>
          <span class="chip fi-mode" data-m="prep">En preparación (${nPrep})</span>
          <span class="chip fi-mode" data-m="todas">Todas (${items.length})</span>
        </div>
        <div class="chips fi-filters" id="fi-ejes" style="margin:8px 0 12px">
          ${ejes.map(e => `<span class="chip fi-filter" data-eje="${fichaEsc(e)}">${fichaEsc(e)}</span>`).join("")}
        </div>
        <div class="norm-list" id="fi-list"></div>
      </section>
      <section class="panel" style="margin-top:18px">
        <h3 class="section-title">Normas base del SERUMS</h3>
        <div class="norm-list">
          ${data.norms.map((n, i) => `
            <article class="norm-card">
              <span>${n.code}</span>
              <h3>${n.title}</h3>
              <p>${n.summary}</p>
              <button class="toggle" data-target="norm-${i}">Ver detalle</button>
              <div class="toggle-panel" id="norm-${i}"><p>${n.detail}</p></div>
            </article>`).join("")}
        </div>
      </section>
    </div>
    <div id="fi-detail-view" hidden></div>`;

  const listView = document.getElementById("fi-list-view");
  const detailView = document.getElementById("fi-detail-view");
  const list = document.getElementById("fi-list");
  const search = document.getElementById("fi-search");

  function draw() {
    const q = search.value.trim().toLowerCase();
    const idx = [];
    items.forEach((it, i) => {
      if (modo === "listas" && !it.ficha) return;
      if (modo === "prep" && it.ficha) return;
      if (eje && it.eje !== eje) return;
      if (q) {
        const hay = (it.code + " " + it.title + " " + (it.t || []).join(" ") + (it.ficha ? " " + it.ficha.definiciones.map(d => d[0]).join(" ") : "")).toLowerCase();
        if (!hay.includes(q)) return;
      }
      idx.push(i);
    });
    list.innerHTML = idx.length
      ? idx.map(i => fichaCard(items[i], i)).join("")
      : `<p style="color:#5B6E6A">No hay normas con ese filtro${modo !== "todas" ? ". Prueba con «Todas»." : "."}</p>`;
  }

  function abrir(i) {
    scrollGuardado = window.pageYOffset || 0;
    detailView.innerHTML = fichaDetalle(items[i], i);
    listView.hidden = true;
    detailView.hidden = false;
    window.scrollTo(0, 0);
    if (root.scrollIntoView) root.scrollIntoView({ block: "start" });
  }

  function volver() {
    detailView.hidden = true;
    detailView.innerHTML = "";
    listView.hidden = false;
    window.scrollTo(0, scrollGuardado);
  }

  search.addEventListener("input", draw);

  document.getElementById("fi-modes").addEventListener("click", e => {
    const chip = e.target.closest(".fi-mode");
    if (!chip) return;
    modo = chip.dataset.m;
    document.querySelectorAll("#fi-modes .fi-mode").forEach(c => c.classList.toggle("on", c.dataset.m === modo));
    draw();
  });

  document.getElementById("fi-ejes").addEventListener("click", e => {
    const chip = e.target.closest(".fi-filter");
    if (!chip) return;
    eje = eje === chip.dataset.eje ? "" : chip.dataset.eje;
    document.querySelectorAll("#fi-ejes .fi-filter").forEach(c => c.classList.toggle("on", c.dataset.eje === eje));
    draw();
  });

  list.addEventListener("click", e => {
    const open = e.target.closest(".fi-open");
    if (open) abrir(Number(open.dataset.i));
  });

  detailView.addEventListener("click", e => {
    if (e.target.closest(".fi-back")) { volver(); return; }
    const opt = e.target.closest(".fi-q .option-btn");
    if (!opt) return;
    const box = opt.closest(".fi-q");
    if (box.dataset.done) return;
    const f = items[Number(box.dataset.key)].ficha;
    const q = f.preguntas[Number(box.dataset.q)];
    const pick = Number(opt.dataset.o);
    box.dataset.done = "1";
    box.querySelectorAll(".option-btn").forEach((b, bi) => {
      if (bi === q.k) b.classList.add("fi-ok");
      else if (bi === pick) b.classList.add("fi-bad");
      b.disabled = true;
    });
    box.querySelector(".fi-q-out").innerHTML = `
      <p class="fi-verdict ${pick === q.k ? "ok" : "bad"}">${pick === q.k ? "✅ Correcto" : "❌ Incorrecto. La clave es " + "ABCD"[q.k]}</p>
      <ul class="fi-traps">${q.w.map((w, wi) => `<li><b>${"ABCD"[wi]})</b> ${fichaEsc(w)}</li>`).join("")}</ul>`;
  });

  bindToggles();
  draw();
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
        <h3 class="section-title">Mis notas</h3>
        <p style="line-height:1.6;color:#5B6E6A">Tus dudas y recordatorios ahora están en <strong>Mis notas</strong>, con casilla de pendiente o resuelta.</p>
        <button id="open-notes" class="action-btn" type="button">Abrir Mis notas</button>
      </div>
    </section>
  `;
  document.getElementById("open-notes").addEventListener("click", () => renderView("notes"));
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
