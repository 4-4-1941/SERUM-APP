let assistantMode = "formatos";
const OFICIO_CATEGORIES = ["Documentos administrativos"];
function renderAssistant(mode) {
  assistantMode = mode === "oficios" ? "oficios" : "formatos";
  const isOficios = assistantMode === "oficios";
  const docs = data.assistantDocs.filter(d => OFICIO_CATEGORIES.includes(d.category) === isOficios);
  pageTitle.textContent = isOficios ? "Oficios" : "Formatos";
  pageSubtitle.textContent = isOficios
    ? "Oficios y documentos administrativos frecuentes en el ejercicio SERUMS: procedimiento, campos obligatorios, ejemplo y errores comunes."
    : "Formatos e informes frecuentes en el ejercicio SERUMS: procedimiento, campos obligatorios, ejemplo y errores comunes.";
  const categories = [...new Set(docs.map(d => d.category))];
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <input id="assistant-search" class="search" placeholder="${isOficios ? "Buscar oficio, solicitud..." : "Buscar formato, informe..."}" />
        <div id="assistant-list"></div>
      </div>
      <div class="panel">
        <h3 class="section-title">Sobre esta sección</h3>
        <p style="line-height:1.6;color:#5B6E6A">Documentos de uso frecuente cuando ya estás trabajando en un establecimiento de salud. No es material de examen — es soporte profesional para tu día a día en la plaza SERUMS.</p>
        ${isOficios ? "" : `<hr style="border:0;border-top:1px solid #D8D2C4;margin:18px 0">
        <h3 class="section-title">Formatos interactivos</h3>
        <p style="line-height:1.6;color:#5B6E6A">Completa una guía, revisa campos obligatorios y guarda el borrador solo en tu navegador. El formato no reemplaza los sistemas ni los procedimientos institucionales.</p>
        <button class="action-btn" id="open-his-register">Abrir Registro Diario HIS →</button>`}
      </div>
    </section>
  `;

  const list = document.getElementById("assistant-list");
  const search = document.getElementById("assistant-search");
  document.getElementById("open-his-register")?.addEventListener("click", () => {
    window.location.href = "capacitacion/recursos/formatos/simulador-his-integral-v0.2.html";
  });

  const integratedPracticeUrls = {
    "ref-001": "capacitacion/recursos/formatos/referencia.html",
    "ref-002": "capacitacion/recursos/formatos/contrarreferencia.html"
  };

  function draw(filter = "") {
    const q = filter.toLowerCase();
    const filtered = docs.filter(d => {
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
    <button id="back-to-assistant-btn" class="toggle" style="margin-bottom:12px;margin-top:0">← Volver a ${assistantMode === "oficios" ? "Oficios" : "Formatos"}</button>
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

  document.getElementById("back-to-assistant-btn").addEventListener("click", () => renderAssistant(assistantMode));

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


// ===== Códigos HIS: grupos, categorías plegables y fuente por código =====
// Los 63 códigos de HIS_EXTRA provienen del simulador HIS integral (v0.2) y de HIS-FICHAS-MOTOR.md (SIP-AI-RAG), con manual, año y página.
const HIS_EXTRA = [{"codigo":"80104","tipo":"CPMS","descripcion":"Tamizaje de drogas múltiples (método no cromatográfico)","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: 1 negativo, 2 positivo o 3 inválido. LAB 2: el n.º de vez que se aplica.","fuente":"Salud Mental 2025 p.12 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"90585","tipo":"CPMS","descripcion":"Vacuna BCG (recién nacido)","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Inmunizaciones 2019 p.6 (tipo D) · NTS 246-2026 Anexo 20 p.136 (código) · Ficha F-007 Vacunación","estado":"Base normativa reemplazada: confirmar con el manual vigente"},{"codigo":"90657","tipo":"CPMS","descripcion":"Vacuna contra la influenza","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Inmunizaciones 2019 p.6 (tipo D) · NTS 246-2026 Anexo 20 p.135 (código) · Ficha F-007 Vacunación","estado":"Base normativa reemplazada: confirmar con el manual vigente"},{"codigo":"90670","tipo":"CPMS","descripcion":"Vacuna antineumocócica","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Inmunizaciones 2019 p.6 (tipo D) · NTS 246-2026 Anexo 20 p.136 (código) · Ficha F-007 Vacunación","estado":"Base normativa reemplazada: confirmar con el manual vigente"},{"codigo":"90678","tipo":"CPMS","descripcion":"Vacuna contra el virus respiratorio sincitial (VRS)","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Hay código, pero las reglas de LAB y tipo de esta vacuna no están cargadas.","fuente":"NTS 246-2026 p.71 (tabla de códigos CPMS, verificada con imagen)","estado":""},{"codigo":"90701","tipo":"CPMS","descripcion":"Vacuna DPT","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Inmunizaciones 2019 p.6 (tipo D) · NTS 246-2026 Anexo 20 p.134 (código) · Ficha F-007 Vacunación","estado":"Base normativa reemplazada: confirmar con el manual vigente"},{"codigo":"90707","tipo":"CPMS","descripcion":"Vacuna SPR","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Inmunizaciones 2019 p.6 (tipo D) · NTS 246-2026 Anexo 20 p.134 (código) · Ficha F-007 Vacunación","estado":"Base normativa reemplazada: confirmar con el manual vigente"},{"codigo":"90715","tipo":"CPMS","descripcion":"Vacuna Tdap (gestante)","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Inmunizaciones 2019 p.6 (tipo D) · NTS 246-2026 Anexo 20 p.136 (código) · Ficha F-007 Vacunación","estado":"Base normativa reemplazada: confirmar con el manual vigente"},{"codigo":"90722","tipo":"CPMS","descripcion":"Vacuna DPT-HVB-HIB (pentavalente), código de la tabla CPMS","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: la dosis 1, 2 o 3, o DA (refuerzo). El Anexo 20 de la NTS 246 (p.134) escribe 90723 para la pentavalente y la tabla CPMS (p.70) escribe 90722 (D-19 de HIS-FICHAS-MOTOR). Confirmar con el equipo de inmunizaciones.","fuente":"NTS 246-2026 p.70 (tabla de códigos CPMS, verificada con imagen)","estado":""},{"codigo":"90723","tipo":"CPMS","descripcion":"Vacuna pentavalente (DPT-HvB-HiB)","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: la dosis 1, 2 o 3, o DA (refuerzo). La tabla CPMS de la NTS 246 (p.70) escribe 90722 para DPT-HVB-HIB; el Anexo 20 (p.134) escribe 90723 (D-19). Confirmar con inmunizaciones.","fuente":"Inmunizaciones 2019 pp.6-21 (LAB) · NTS 246-2026 Anexo 20 p.134 (código) · Ficha F-007 Vacunación","estado":"Base normativa reemplazada: confirmar con el manual vigente"},{"codigo":"90744","tipo":"CPMS","descripcion":"Vacuna hepatitis B (recién nacido)","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Inmunizaciones 2019 p.6 (tipo D) · NTS 246-2026 Anexo 20 p.136 (código) · Ficha F-007 Vacunación","estado":"Base normativa reemplazada: confirmar con el manual vigente"},{"codigo":"90872","tipo":"CPMS","descripcion":"Taller de habilidades sociales","categoria":"Prevención: Familias Fuertes y habilidades sociales","grupo":"Salud mental","notaRegistro":"LAB 1: n.º de sesión (1 a 10).","fuente":"Salud Mental 2025 pp.16-17 · Ficha F-010 Familias Fuertes y habilidades sociales","estado":""},{"codigo":"96154","tipo":"CPMS","descripcion":"Intervención en salud y comportamiento (CST)","categoria":"Capacitación a cuidadores (CST)","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.64-66 · Ficha F-016 Capacitación a cuidadores","estado":""},{"codigo":"99205","tipo":"CPMS","descripcion":"Atención de enfermería en I nivel","categoria":"Atención individual, grupal y alta","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.34-37, 61 · Ficha F-008 Atención individual, grupal y alta y F-015 Situación de calle o población dispersa","estado":""},{"codigo":"99217","tipo":"CPMS","descripcion":"Manejo del alta","categoria":"Atención individual, grupal y alta","grupo":"Salud mental","notaRegistro":"LAB 1: tipo de alta 1 a 5.","fuente":"Salud Mental 2025 p.14 · Ficha F-008 Atención individual, grupal y alta","estado":""},{"codigo":"99366","tipo":"CPMS","descripcion":"Reunión del equipo de salud mental","categoria":"Atención individual, grupal y alta","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: n.º de reunión o de evaluación. LAB 2: el profesional que participa, de 1 a 6.","fuente":"Salud Mental 2025 pp.34-37 · Ficha F-008 Atención individual, grupal y alta","estado":""},{"codigo":"99605","tipo":"CPMS","descripcion":"Seguimiento farmacoterapéutico inicial","categoria":"Atención farmacéutica","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: n.º de seguimiento.","fuente":"Salud Mental 2025 pp.56-57 · Ficha F-018 Atención farmacéutica","estado":""},{"codigo":"99606","tipo":"CPMS","descripcion":"Seguimiento farmacoterapéutico de continuidad","categoria":"Atención farmacéutica","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: n.º de seguimiento.","fuente":"Salud Mental 2025 pp.56-57 · Ficha F-018 Atención farmacéutica","estado":""},{"codigo":"C0009","tipo":"CPMS","descripcion":"Sesión educativa","categoria":"Sesiones educativas y demostrativas","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: n.º de participantes.","fuente":"Salud Familiar 2014 p.9-10 · Inmunizaciones 2019 p.24 · Adulto Mayor 2019 p.23-24 · Ficha F-001 Sesión educativa","estado":"Vigencia no determinada"},{"codigo":"C0010","tipo":"CPMS","descripcion":"Sesión demostrativa","categoria":"Sesiones educativas y demostrativas","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: n.º de participantes (grupal) o ALI (individual, familias con niños de 6-11 meses y gestantes).","fuente":"Promoción 2024 pp.17-18 · Adulto Mayor 2019 p.23 · Ficha F-002 Sesión demostrativa","estado":"Vigencia no determinada"},{"codigo":"C0005","tipo":"CPMS","descripcion":"Taller para instituciones educativas","categoria":"Salud mental en instituciones educativas","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: n.º de sesión. LAB 2: n.º de participantes.","fuente":"Salud Mental 2025 pp.28-30 · Ficha F-009 Salud mental en instituciones educativas","estado":""},{"codigo":"C0003","tipo":"CPMS","descripcion":"Reunión en comunidad","categoria":"Salud mental en instituciones educativas","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: n.º de reunión.","fuente":"Salud Mental 2025 pp.20, 24 · Ficha F-009 Salud mental en instituciones educativas","estado":""},{"codigo":"99402.14","tipo":"CPMS","descripcion":"Promoción del buen trato y salud mental","categoria":"Salud mental en instituciones educativas","grupo":"Salud mental","notaRegistro":"","fuente":"Salud Mental 2025 pp.28-30 · Ficha F-009 Salud mental en instituciones educativas","estado":""},{"codigo":"96150.03","tipo":"CPMS","descripcion":"Tamizaje en trastornos depresivos","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"","fuente":"Salud Mental 2025 pp.10-11 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"96150.01","tipo":"CPMS","descripcion":"Tamizaje en violencia","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"","fuente":"Salud Mental 2025 p.10 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"96150.02","tipo":"CPMS","descripcion":"Tamizaje en alcohol y drogas","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"","fuente":"Salud Mental 2025 p.10 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"96150.08","tipo":"CPMS","descripcion":"Tamizaje trastornos mentales NNA (PSC)","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"","fuente":"Salud Mental 2025 pp.11-12 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"99402.09","tipo":"CPMS","descripcion":"Consejería de prevención de riesgos en salud mental","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"","fuente":"Salud Mental 2025 p.10 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"Z133","tipo":"CIE10","descripcion":"Pesquisa de problemas relacionados a la salud mental","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"","fuente":"Salud Mental 2025 p.11 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"99207.02","tipo":"CPMS","descripcion":"Intervención grupal","categoria":"Atención individual, grupal y alta","grupo":"Salud mental","notaRegistro":"LAB 1: n.º de sesión.","fuente":"Salud Mental 2025 p.13 · Ficha F-008 Atención individual, grupal y alta","estado":""},{"codigo":"96150.04","tipo":"CPMS","descripcion":"Tamizaje en psicosis","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.10-11 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"96150.05","tipo":"CPMS","descripcion":"Cuestionario de habilidades sociales","categoria":"Prevención: Familias Fuertes y habilidades sociales","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.16-17 · Ficha F-010 Familias Fuertes y habilidades sociales","estado":""},{"codigo":"96150.06","tipo":"CPMS","descripcion":"Tamizaje M-CHAT (niños de 2 años)","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.10-11 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"96150.07","tipo":"CPMS","descripcion":"Tamizaje de deterioro cognitivo (60 años y más)","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.10-11 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"R456","tipo":"CIE10","descripcion":"Problemas relacionados con violencia (positividad)","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 p.10 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"Z720","tipo":"CIE10","descripcion":"Problemas relacionados con tabaco (positividad)","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 p.10 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"Z721","tipo":"CIE10","descripcion":"Problemas sociales relacionados con el uso de alcohol (positividad)","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 p.10 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"Z722","tipo":"CIE10","descripcion":"Problemas sociales relacionados con el uso de drogas (positividad)","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 p.10 · Ficha F-006 Tamizaje de salud mental","estado":""},{"codigo":"Z654","tipo":"CIE10","descripcion":"Víctima de crimen o terrorismo, incluyendo tortura","categoria":"Tamizaje de salud mental","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.8, 44 · Ficha F-006 Tamizaje de salud mental y F-014 Violencia política","estado":""},{"codigo":"Z655","tipo":"CIE10","descripcion":"Exposición a desastres, guerras u otras hostilidades","categoria":"Crisis humanitarias y violencia política","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.31-33, 46-48 · Ficha F-013 Crisis humanitarias","estado":""},{"codigo":"99207.01","tipo":"CPMS","descripcion":"Intervención individual","categoria":"Atención individual, grupal y alta","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: n.º de sesión.","fuente":"Salud Mental 2025 p.13 · Ficha F-008 Atención individual, grupal y alta","estado":""},{"codigo":"99207.08","tipo":"CPMS","descripcion":"Primeros auxilios psicológicos","categoria":"Crisis humanitarias y violencia política","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.31-32, 46-47 · Ficha F-013 Crisis humanitarias","estado":""},{"codigo":"99207.09","tipo":"CPMS","descripcion":"Continuidad de cuidados a personas con trastorno mental grave","categoria":"Continuidad de cuidados (CSMC)","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: n.º de sesión, DVR (derivado), IA (ingreso) o TA (alta).","fuente":"Salud Mental 2025 pp.38-42 · Ficha F-011 Continuidad de cuidados","estado":""},{"codigo":"C8002","tipo":"CPMS","descripcion":"Plan de continuidad de cuidados individualizado","categoria":"Continuidad de cuidados (CSMC)","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. C8002 también aparece como «Plan de atención integral» en Pueblos Indígenas 2022 (pp.12-13) y en Adulto Mayor 2019; en Salud Mental 2025 es el plan de continuidad de cuidados (p.41). Confirmar en el catálogo CPMS (D-14 de HIS-FICHAS-MOTOR).","fuente":"Salud Mental 2025 p.41 · Ficha F-011 Continuidad de cuidados","estado":""},{"codigo":"97537.01","tipo":"CPMS","descripcion":"Entrenamiento para la inserción laboral","categoria":"Rehabilitación psicosocial y laboral","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: n.º de sesión (mínimo 10 sesiones).","fuente":"Salud Mental 2025 p.43 · Ficha F-012 Rehabilitación psicosocial y laboral","estado":""},{"codigo":"96100.02","tipo":"CPMS","descripcion":"Consejería y orientación psicológica (IE)","categoria":"Salud mental en instituciones educativas","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.25-26 · Ficha F-009 Salud mental en instituciones educativas","estado":""},{"codigo":"99401.15","tipo":"CPMS","descripcion":"Consejería en habilidades sociales","categoria":"Prevención: Familias Fuertes y habilidades sociales","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 p.16 · Ficha F-010 Familias Fuertes y habilidades sociales","estado":""},{"codigo":"C2111.01","tipo":"CPMS","descripcion":"Psicoeducación a la familia","categoria":"Prevención: Familias Fuertes y habilidades sociales","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'.","fuente":"Salud Mental 2025 pp.18-19, 32, 47 · Ficha F-010 Familias Fuertes y habilidades sociales y F-013 Crisis humanitarias","estado":""},{"codigo":"C2111.02","tipo":"CPMS","descripcion":"Taller Familias Fuertes","categoria":"Prevención: Familias Fuertes y habilidades sociales","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: el n.º de sesión, de 1 a 7.","fuente":"Salud Mental 2025 p.15 · Ficha F-010 Familias Fuertes y habilidades sociales","estado":""},{"codigo":"C0071","tipo":"CPMS","descripcion":"Análisis de la situación de salud","categoria":"Crisis humanitarias y violencia política","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: n.º de reunión (1 a 6). LAB 2: n.º de participantes.","fuente":"Salud Mental 2025 pp.20-21, 44 · Ficha F-014 Violencia política","estado":""},{"codigo":"99207.07","tipo":"CPMS","descripcion":"Acompañamiento psicosocial a víctimas de violencia política","categoria":"Crisis humanitarias y violencia política","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: n.º de reunión (1 a 6). LAB 2: n.º de participantes.","fuente":"Salud Mental 2025 pp.21-22, 45 · Ficha F-014 Violencia política","estado":""},{"codigo":"C0006","tipo":"CPMS","descripcion":"Taller comunitario","categoria":"Crisis humanitarias y violencia política","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: n.º de reunión (1 a 6). LAB 2: n.º de participantes.","fuente":"Salud Mental 2025 pp.22-23, 45-46 · Ficha F-014 Violencia política","estado":""},{"codigo":"C1043","tipo":"CPMS","descripcion":"Coordinación con actores e instituciones","categoria":"Participación social y comunitaria","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: n.º de reunión.","fuente":"Salud Mental 2025 p.49 · Ficha F-017 Participación social y comunitaria","estado":""},{"codigo":"C3001","tipo":"CPMS","descripcion":"Reunión de participación comunitaria y empoderamiento social","categoria":"Participación social y comunitaria","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI.","fuente":"Salud Mental 2025 pp.50-54 · Ficha F-017 Participación social y comunitaria","estado":""},{"codigo":"C3051","tipo":"CPMS","descripcion":"Conformación de asociación de usuarios y familiares","categoria":"Participación social y comunitaria","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: el tipo de organización, 1 o 2.","fuente":"Salud Mental 2025 pp.50-51 · Ficha F-017 Participación social y comunitaria","estado":""},{"codigo":"C3141","tipo":"CPMS","descripcion":"Sesión educativa para participación de familia y comunidad","categoria":"Participación social y comunitaria","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. LAB 1: n.º del tema. LAB 2: n.º de participantes.","fuente":"Salud Mental 2025 pp.49-50 · Ficha F-017 Participación social y comunitaria","estado":""},{"codigo":"C1001","tipo":"CPMS","descripcion":"Reunión para abogacía y políticas públicas","categoria":"Participación social y comunitaria","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI.","fuente":"Salud Mental 2025 p.53 · Ficha F-017 Participación social y comunitaria","estado":""},{"codigo":"C7004","tipo":"CPMS","descripcion":"Asistencia técnica","categoria":"Participación social y comunitaria","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI.","fuente":"Salud Mental 2025 pp.51-55 · Ficha F-017 Participación social y comunitaria","estado":""},{"codigo":"C7002","tipo":"CPMS","descripcion":"Supervisión","categoria":"Participación social y comunitaria","grupo":"Promoción y comunitarias","notaRegistro":"Tipo de diagnóstico: siempre 'D'. Actividad grupal: en HC/DNI va el código APP del grupo, no un DNI. En otro ejemplo del mismo manual aparece C7002.01 (p.31): confirmar el código en el catálogo (D-14).","fuente":"Salud Mental 2025 pp.54-55 · Ficha F-017 Participación social y comunitaria","estado":""},{"codigo":"C0061.02","tipo":"CPMS","descripcion":"Farmacovigilancia","categoria":"Atención farmacéutica","grupo":"Salud mental","notaRegistro":"Tipo de diagnóstico: siempre 'D'. LAB 1: n.º de farmacovigilancia. LAB 2: la causalidad, de 1 a 6.","fuente":"Salud Mental 2025 p.57 · Ficha F-018 Atención farmacéutica","estado":""},{"codigo":"90749.06","tipo":"CPMS","descripcion":"Vacuna hexavalente (DPT-HVB-HIB-IPV)","categoria":"Vacunas","grupo":"Vacunas","notaRegistro":"Hay código, pero las reglas de LAB y tipo de esta vacuna no están cargadas.","fuente":"NTS 246-2026 p.71 (tabla de códigos CPMS, verificada con imagen)","estado":""},{"codigo":"U0020","tipo":"CPMS","descripcion":"Actividades de la ESN Salud Familiar","categoria":"Sesiones educativas y demostrativas","grupo":"Promoción y comunitarias","notaRegistro":"","fuente":"Salud Familiar 2014 p.9 · Ficha F-001 Sesión educativa","estado":"Edición histórica"},{"codigo":"U0009","tipo":"CPMS","descripcion":"Actividades de Inmunizaciones","categoria":"Sesiones educativas y demostrativas","grupo":"Promoción y comunitarias","notaRegistro":"","fuente":"Inmunizaciones 2019 p.24 · Ficha F-001 Sesión educativa","estado":"Base normativa reemplazada: confirmar con el manual vigente"}];
const HIS_GROUPS = ["Niño", "Salud mental", "Vacunas", "Promoción y comunitarias"];
const HIS_NINO_SRC = "Manual de Registro y Codificación — Etapa de Vida Niño, MINSA, febrero 2021";

function hisEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function hisNorm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function hisInjectStyle() {
  if (document.getElementById("his-codes-style")) return;
  const st = document.createElement("style");
  st.id = "his-codes-style";
  st.textContent = `
.his-chips{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 12px}
.his-chip{border:1px solid var(--line);background:#FBFDFC;color:var(--ink);border-radius:999px;padding:8px 14px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
.his-chip small{opacity:.7;font-weight:700;margin-left:4px}
.his-chip[aria-pressed="true"]{background:var(--primary);border-color:var(--primary);color:#fff}
.his-chip[data-g="Niño"][aria-pressed="false"]{border-left:5px solid #1B7A4D}
.his-chip[data-g="Salud mental"][aria-pressed="false"]{border-left:5px solid #255a91}
.his-chip[data-g="Vacunas"][aria-pressed="false"]{border-left:5px solid #B3261E}
.his-chip[data-g="Promoción y comunitarias"][aria-pressed="false"]{border-left:5px solid #8A6D3B}
.his-count{font-size:12.5px;color:var(--muted);margin:0 0 6px}
.his-group-title{margin:20px 0 8px;font-size:18px;color:var(--primary-dark)}
.his-cat{border:1px solid var(--line);border-radius:12px;background:var(--surface);margin:0 0 10px;overflow:hidden}
.his-cat>summary{cursor:pointer;list-style:none;padding:13px 16px;font-weight:700;color:var(--ink);display:flex;justify-content:space-between;align-items:center;gap:10px}
.his-cat>summary::-webkit-details-marker{display:none}
.his-cat>summary::after{content:"▾";color:var(--muted);transition:transform .15s}
.his-cat[open]>summary::after{transform:rotate(180deg)}
.his-cat[open]>summary{border-bottom:1px solid var(--line);background:#F6F9F8}
.his-cat-n{font-size:12px;font-weight:700;color:var(--muted);margin-left:auto}
.his-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;padding:12px}
.his-card{border:1px solid var(--line);border-radius:10px;padding:12px 13px;background:#fff}
.his-code{display:inline-block;font:700 15px ui-monospace,Menlo,Consolas,monospace;color:var(--primary-dark);background:#EEF2F0;border-radius:6px;padding:2px 8px}
.his-tipo{display:inline-block;margin-left:6px;font-size:10.5px;font-weight:800;letter-spacing:.06em;border-radius:999px;padding:2px 8px;vertical-align:2px}
.his-tipo.cie{background:#E3F2EA;color:#1B7A4D}
.his-tipo.cpms{background:#F3EBDC;color:#8A6D3B}
.his-card h4{margin:8px 0 4px;font-size:14.5px;line-height:1.35;color:var(--ink)}
.his-nota{margin:4px 0 0;font-size:13px;line-height:1.45;color:var(--muted)}
.his-src{margin:6px 0 0;font-size:11.5px;color:#7a8b87}
.his-warn{display:inline-block;margin-top:6px;font-size:11.5px;font-weight:700;color:#8a5a00;background:#FFF3D6;border-radius:6px;padding:2px 8px}
@media(max-width:600px){.his-grid{grid-template-columns:1fr;padding:10px}.his-chip{padding:8px 12px}}`;
  document.head.appendChild(st);
}

function renderHisCodesChild() {
  hisInjectStyle();
  pageTitle.textContent = "Códigos HIS";
  pageSubtitle.textContent = "Buscador de códigos CIE10/CPMS y reglas de registro para la Hoja HIS, con su fuente (manual, año y página).";

  const all = data.hisCodigosNino
    .map(d => ({ ...d, grupo: "Niño", fuente: HIS_NINO_SRC, estado: "" }))
    .concat(HIS_EXTRA);

  let grupo = "Todos";
  let query = "";

  root.innerHTML = `
    <section class="panel">
      <input id="hiscodes-search" class="search" placeholder="Buscar por código, diagnóstico o actividad (ej. J189, CRED, 96150, tamizaje)..." />
      <div class="his-chips" id="hiscodes-chips"></div>
      <p class="his-count" id="hiscodes-count" aria-live="polite"></p>
      <div id="hiscodes-list"></div>
    </section>
    <section class="panel" style="margin-top:14px">
      <h3 class="section-title">Sobre esta tabla</h3>
      <p style="line-height:1.6;color:#5B6E6A">Códigos CIE10/CPMS de la Hoja HIS organizados por grupo. Cada tarjeta indica cómo marcar «Tipo de diagnóstico» y qué anotar en el campo LAB, con el manual y la página de donde sale. Las etiquetas amarillas avisan cuando la edición del manual debe confirmarse. Material de consulta: no reemplaza el manual completo del MINSA.</p>
    </section>`;

  const list = document.getElementById("hiscodes-list");
  const search = document.getElementById("hiscodes-search");
  const chips = document.getElementById("hiscodes-chips");
  const count = document.getElementById("hiscodes-count");

  function drawChips() {
    const mk = (g, n) => `<button type="button" class="his-chip" data-g="${hisEsc(g)}" aria-pressed="${g === grupo}">${hisEsc(g)}<small>${n}</small></button>`;
    chips.innerHTML = mk("Todos", all.length) + HIS_GROUPS.map(g => mk(g, all.filter(d => d.grupo === g).length)).join("");
  }

  function card(d) {
    return `
      <article class="his-card">
        <span class="his-code">${hisEsc(d.codigo)}</span><span class="his-tipo ${d.tipo === "CIE10" ? "cie" : "cpms"}">${hisEsc(d.tipo)}</span>
        <h4>${hisEsc(d.descripcion)}</h4>
        ${d.notaRegistro ? `<p class="his-nota"><strong>Registro:</strong> ${hisEsc(d.notaRegistro)}</p>` : ""}
        ${d.estado ? `<span class="his-warn">⚠ ${hisEsc(d.estado)}</span>` : ""}
        <p class="his-src">📖 ${hisEsc(d.fuente)}</p>
      </article>`;
  }

  function draw() {
    const q = hisNorm(query.trim());
    const filtered = all.filter(d =>
      (grupo === "Todos" || d.grupo === grupo) &&
      (!q || hisNorm([d.codigo, d.codigo.replace(/\./g, ""), d.descripcion, d.categoria, d.tipo, d.notaRegistro].join(" ")).includes(q))
    );
    count.textContent = filtered.length
      ? `${filtered.length} código${filtered.length === 1 ? "" : "s"}${q ? (filtered.length === 1 ? " encontrado" : " encontrados") : ""}`
      : "";

    const html = HIS_GROUPS.map(g => {
      const items = filtered.filter(d => d.grupo === g);
      if (!items.length) return "";
      const cats = [...new Set(items.map(d => d.categoria))];
      const open = q ? " open" : "";
      const body = cats.map(c => {
        const its = items.filter(d => d.categoria === c);
        return `<details class="his-cat"${open}>
          <summary>${hisEsc(c)}<span class="his-cat-n">${its.length}</span></summary>
          <div class="his-grid">${its.map(card).join("")}</div>
        </details>`;
      }).join("");
      return (grupo === "Todos" ? `<h3 class="his-group-title">${hisEsc(g)}</h3>` : "") + body;
    }).join("");

    list.innerHTML = html || `<p style="color:#5B6E6A">No hay códigos con ese filtro.</p>`;
  }

  chips.addEventListener("click", e => {
    const b = e.target.closest(".his-chip");
    if (!b) return;
    grupo = b.dataset.g;
    drawChips();
    draw();
  });
  search.addEventListener("input", () => { query = search.value; draw(); });

  drawChips();
  draw();
}
