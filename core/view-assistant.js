function renderAssistant() {
  pageTitle.textContent = "Asistente Profesional";
  pageSubtitle.textContent = "Formatos, oficios e informes frecuentes en el ejercicio SERUMS: procedimiento, campos obligatorios, ejemplo y errores comunes.";
  const categories = [...new Set(data.assistantDocs.map(d => d.category))];
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <input id="assistant-search" class="search" placeholder="Buscar formato, oficio, informe..." />
        <div id="assistant-list"></div>
      </div>
      <div class="panel">
        <h3 class="section-title">Sobre esta sección</h3>
        <p style="line-height:1.6;color:#5B6E6A">Documentos de uso frecuente cuando ya estás trabajando en un establecimiento de salud. No es material de examen — es soporte profesional para tu día a día en la plaza SERUMS.</p>
        <hr style="border:0;border-top:1px solid #D8D2C4;margin:18px 0">
        <h3 class="section-title">Formatos interactivos</h3>
        <p style="line-height:1.6;color:#5B6E6A">Completa una guía, revisa campos obligatorios y guarda el borrador solo en tu navegador. El formato no reemplaza los sistemas ni los procedimientos institucionales.</p>
        <button class="action-btn" id="open-his-register">Abrir Registro Diario HIS →</button>
      </div>
    </section>
  `;

  const list = document.getElementById("assistant-list");
  const search = document.getElementById("assistant-search");
  document.getElementById("open-his-register").addEventListener("click", () => {
    window.location.href = "capacitacion/recursos/formatos/simulador-his-integral-v0.1.html";
  });

  const integratedPracticeUrls = {
    "ref-001": "capacitacion/recursos/formatos/referencia.html",
    "ref-002": "capacitacion/recursos/formatos/contrarreferencia.html"
  };

  function draw(filter = "") {
    const q = filter.toLowerCase();
    const filtered = data.assistantDocs.filter(d => {
      const text = [d.title, d.category, d.purpose].join(" ").toLowerCase();
      return text.includes(q);
    });

    const grouped = categories
      .map(cat => ({ category: cat, items: filtered.filter(d => d.category === cat) }))
      .filter(g => g.items.length);

    list.innerHTML = grouped.map(g => `
      <h3 class="section-title" style="margin-top:18px">${g.category}</h3>
      <div class="norm-list">
        ${g.items.map((d, i) => `
          <article class="norm-card">
            <span>${d.category}</span>
            ${sourceStatusBadge(d)}
            <h3>${d.title}</h3>
            <p>${d.purpose}</p>
            <button class="toggle" data-target="doc-${d.id}">Ver formato completo</button>
            <div class="toggle-panel" id="doc-${d.id}">
              <p><strong>Campos obligatorios:</strong></p>
              <ul style="margin:6px 0 12px 18px;color:#5B6E6A">
                ${d.requiredFields.map(f => `<li>${f}</li>`).join("")}
              </ul>
              <p><strong>Formato base:</strong></p>
              <pre style="white-space:pre-wrap;background:#F7F5F2;padding:10px;border-radius:6px;font-size:13px;margin:6px 0 12px">${d.templateText}</pre>
              <p><strong>Ejemplo de llenado:</strong></p>
              <p style="margin:6px 0 12px;color:#5B6E6A">${d.exampleFilled}</p>
              <p><strong>Errores frecuentes:</strong></p>
              <ul style="margin:6px 0 12px 18px;color:#8A2A24">
                ${d.commonErrors.map(e => `<li>${e}</li>`).join("")}
              </ul>
              ${d.relatedNormCodes.length ? `<p style="color:#5B6E6A"><strong>Normativa relacionada:</strong> ${d.relatedNormCodes.join(", ")}</p>` : ""}
              <button class="action-btn" data-practice="${d.id}" style="margin-top:12px">${integratedPracticeUrls[d.id] ? "Abrir formato interactivo →" : "Practicar llenado →"}</button>
            </div>
          </article>
        `).join("")}
      </div>
    `).join("") || `<p style="color:#5B6E6A">No hay documentos con ese filtro.</p>`;

    bindToggles();
    list.querySelectorAll("[data-practice]").forEach(btn => {
      btn.addEventListener("click", () => {
        const practiceUrl = integratedPracticeUrls[btn.dataset.practice];
        if (practiceUrl) {
          window.location.href = practiceUrl;
          return;
        }
        renderAssistantPractice(btn.dataset.practice);
      });
    });
  }

  draw();
  search.addEventListener("input", () => draw(search.value));
}

function renderAssistantPractice(docId) {
  const doc = data.assistantDocs.find(d => d.id === docId);
  if (!doc) return;
  pageTitle.textContent = `Práctica: ${doc.title}`;
  pageSubtitle.textContent = "Redacta el documento a partir del caso planteado y luego compáralo con el modelo.";

  const st = assistantPracticeState[docId] || { attempts: 0, draft: "", revealed: false };

  root.innerHTML = `
    <button id="back-to-assistant-btn" class="toggle" style="margin-bottom:12px;margin-top:0">← Volver a Asistente Profesional</button>
    <section class="two-col">
      <div class="panel">
        <div class="badge">${doc.category}</div>
        ${sourceStatusBadge(doc)}
        <h3 class="section-title">${doc.title}</h3>
        <p><strong>Caso:</strong> ${doc.practiceScenario}</p>
        <p style="margin-top:10px;color:#5B6E6A"><strong>Recuerda incluir:</strong></p>
        <ul style="margin:6px 0 12px 18px;color:#5B6E6A">
          ${doc.requiredFields.map(f => `<li>${f}</li>`).join("")}
        </ul>
        <textarea id="practice-draft" placeholder="Redacta aquí tu documento..." style="width:100%;min-height:220px;padding:10px;border-radius:6px;border:1px solid #D8D2C4;font-family:inherit;font-size:14px">${st.draft || ""}</textarea>
        <p style="margin-top:8px;color:#5B6E6A;font-size:13px">Intentos de práctica: ${st.attempts}</p>
        <button class="action-btn" id="compare-btn" style="margin-top:8px">${st.revealed ? "Comparar de nuevo" : "Comparar con el modelo"}</button>
      </div>
      <div class="panel" id="practice-model" style="display:${st.revealed ? "block" : "none"}">
        <h3 class="section-title">Documento modelo</h3>
        <pre style="white-space:pre-wrap;background:#F7F5F2;padding:10px;border-radius:6px;font-size:13px;margin:6px 0 12px">${doc.templateText}</pre>
        <p><strong>Ejemplo aplicado al caso:</strong></p>
        <p style="color:#5B6E6A">${doc.exampleFilled}</p>
        <p style="margin-top:12px"><strong>Autoevalúa tu redacción — ¿incluiste todo esto?</strong></p>
        <ul style="margin:6px 0 12px 18px;color:#5B6E6A">
          ${doc.requiredFields.map(f => `<li>${f}</li>`).join("")}
        </ul>
        <p><strong>Errores frecuentes a evitar:</strong></p>
        <ul style="margin:6px 0 12px 18px;color:#8A2A24">
          ${doc.commonErrors.map(e => `<li>${e}</li>`).join("")}
        </ul>
      </div>
    </section>
  `;

  document.getElementById("back-to-assistant-btn").addEventListener("click", renderAssistant);

  const draft = document.getElementById("practice-draft");
  document.getElementById("compare-btn").addEventListener("click", () => {
    st.attempts += 1;
    st.draft = draft.value;
    st.revealed = true;
    assistantPracticeState[docId] = st;
    saveProgress("assistantPracticeState", assistantPracticeState);
    renderAssistantPractice(docId);
  });
}

function renderHisCodesChild() {
  pageTitle.textContent = "Códigos HIS — Etapa de Vida Niño";
  pageSubtitle.textContent = "Buscador de códigos CIE10/CPMS y reglas de registro para la Hoja HIS. Fuente: Manual de Registro y Codificación — Etapa de Vida Niño, MINSA 2021.";

  const categories = [...new Set(data.hisCodigosNino.map(d => d.categoria))];

  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <input id="hiscodes-search" class="search" placeholder="Buscar por código, diagnóstico o actividad (ej. J189, CRED, hierro, EDA)..." />
        <div id="hiscodes-list"></div>
      </div>
      <div class="panel">
        <h3 class="section-title">Sobre esta tabla</h3>
        <p style="line-height:1.6;color:#5B6E6A">Codificación CIE10/CPMS para las secciones de mayor uso diario: CRED por grupo de edad, Infecciones Respiratorias Agudas (IRA) y Enfermedad Diarreica Aguda (EDA). Cada tarjeta indica cómo marcar "Tipo de diagnóstico" y qué anotar en el campo LAB. Este material es de consulta administrativa — no reemplaza el manual completo del MINSA.</p>
      </div>
    </section>
  `;

  const list = document.getElementById("hiscodes-list");
  const search = document.getElementById("hiscodes-search");

  function draw(filter = "") {
    const q = filter.toLowerCase();
    const filtered = data.hisCodigosNino.filter(d => {
      const text = [d.codigo, d.descripcion, d.categoria, d.tipo].join(" ").toLowerCase();
      return text.includes(q);
    });

    const grouped = categories
      .map(cat => ({ category: cat, items: filtered.filter(d => d.categoria === cat) }))
      .filter(g => g.items.length);

    list.innerHTML = grouped.map(g => `
      <h3 class="section-title" style="margin-top:18px">${g.category}</h3>
      <div class="norm-list">
        ${g.items.map((d, i) => `
          <article class="norm-card">
            <span>${d.tipo}</span>
            <h3>${d.codigo} — ${d.descripcion}</h3>
            ${d.notaRegistro ? `<p style="color:#5B6E6A;margin-top:4px"><strong>Registro:</strong> ${d.notaRegistro}</p>` : ""}
          </article>
        `).join("")}
      </div>
    `).join("") || `<p style="color:#5B6E6A">No hay códigos con ese filtro.</p>`;
  }

  draw();
  search.addEventListener("input", () => draw(search.value));
}
