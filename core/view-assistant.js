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
        <button class="action-btn" id="open-his-register">Abrir Registro Diario HIS →</button>
        <button class="action-btn" id="open-his-paquetes" style="margin-top:10px">Abrir Hoja HIS por paquetes →</button>`}
      </div>
    </section>
  `;

  const list = document.getElementById("assistant-list");
  const search = document.getElementById("assistant-search");
  document.getElementById("open-his-register")?.addEventListener("click", () => {
    window.location.href = "capacitacion/recursos/formatos/simulador-his-integral-v0.2.html";
  });
  document.getElementById("open-his-paquetes")?.addEventListener("click", () => {
    window.location.href = "capacitacion/recursos/formatos/his-paquetes.html";
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

// Salud bucal: 888 códigos (392 diagnósticos CIE10 + 496 procedimientos CPMS) del Manual de Salud Bucal 2025 (pp.7-14). Categorías por rango de código; extracción automática, pendiente de revisión humana.

// Adulto mayor: 123 códigos del Manual de Registro y Codificación de Adulto Mayor 2025. Extracción automática, pendiente de revisión humana.

// Adulto: 97 códigos del Manual de registro y codificación, Curso de Vida Adulto 2025. Extracción automática, pendiente de revisión humana.

// Salud mental (ampliación): 774 códigos del Manual de Salud Mental 2025: 65 actividades frecuentes nuevas + 709 diagnósticos del Anexo VII. Extracción automática, pendiente de revisión humana.

// Pueblos indígenas: 27 códigos HIS del Manual de Registro y Codificación según grupo étnico (2022) + los 60 códigos de pertenencia étnica. Análisis propio, clasificación por IA pendiente de revisión humana.

// Planificación familiar: actividades más frecuentes del Manual de Registro y Codificación de Planificación Familiar 2024 (pp. 7-8). Análisis propio, clasificación por IA pendiente de revisión humana.

// Manuales HIS restantes (tablas de diagnósticos y actividades más frecuentes de cada manual). Análisis propio, clasificación por IA pendiente de revisión humana.


















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
.his-chip[data-g="Salud bucal"][aria-pressed="false"]{border-left:5px solid #0E7C86}
.his-chip[data-g="Adulto mayor"][aria-pressed="false"]{border-left:5px solid #6B4E9B}
.his-chip[data-g="Adulto"][aria-pressed="false"]{border-left:5px solid #C2641B}
.his-chip[data-g="Pueblos indígenas"][aria-pressed="false"]{border-left:5px solid #A0522D}
.his-chip[data-g="Planificación familiar"][aria-pressed="false"]{border-left:5px solid #B5446E}
.his-chip[data-g="Salud ocular"][aria-pressed="false"]{border-left:5px solid #2E8B8B}
.his-chip[data-g="ITS y hepatitis"][aria-pressed="false"]{border-left:5px solid #9C3D54}
.his-chip[data-g="Tuberculosis"][aria-pressed="false"]{border-left:5px solid #5C6F2B}
.his-chip[data-g="Cáncer"][aria-pressed="false"]{border-left:5px solid #6B4C9A}
.his-chip[data-g="Discapacidad"][aria-pressed="false"]{border-left:5px solid #3E6FA3}
.his-chip[data-g="Adolescente"][aria-pressed="false"]{border-left:5px solid #C07A12}
.his-chip[data-g="Metaxénicas"][aria-pressed="false"]{border-left:5px solid #8A4B2D}
.his-chip[data-g="Anemia"][aria-pressed="false"]{border-left:5px solid #B33A5B}
.his-chip[data-g="Materno perinatal"][aria-pressed="false"]{border-left:5px solid #E0457B}
.his-chip[data-g="Emergencias y urgencias"][aria-pressed="false"]{border-left:5px solid #D9480F}
.his-chip[data-g="Zoonosis y rabia"][aria-pressed="false"]{border-left:5px solid #546E7A}
.his-chip[data-g="Daños no transmisibles"][aria-pressed="false"]{border-left:5px solid #7A6B00}
.his-chip[data-g="Transversal"][aria-pressed="false"]{border-left:5px solid #37474F}
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
.his-tipo.etn{background:#EADFD6;color:#7A3E1D}
.his-card h4{margin:8px 0 4px;font-size:14.5px;line-height:1.35;color:var(--ink)}
.his-nota{margin:4px 0 0;font-size:13px;line-height:1.45;color:var(--muted)}
.his-src{margin:6px 0 0;font-size:11.5px;color:#7a8b87}
.his-link{display:inline-block;margin-top:6px;font-size:12px;font-weight:700;color:var(--primary);text-decoration:none;border:1px solid var(--primary);border-radius:999px;padding:3px 10px}
.his-link:active{background:var(--primary);color:#fff}
button.his-link{background:none;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.his-pdf{position:fixed;inset:0;z-index:3000;background:#2b2f2e;display:flex;flex-direction:column}
.his-pdf-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;background:#fff;border-bottom:1px solid var(--line)}
.his-pdf-title{flex:1 1 140px;min-width:0;font-size:13px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.his-pdf-ctl{display:flex;align-items:center;gap:6px}
.his-pdf-pos{font-size:12.5px;font-weight:700;color:var(--ink);min-width:74px;text-align:center}
.his-pdf-btn{border:1px solid var(--line);background:var(--primary-soft);color:var(--primary-dark);border-radius:8px;padding:8px 12px;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.his-pdf-body{flex:1;overflow:auto;text-align:center;padding:10px;-webkit-overflow-scrolling:touch}
.his-pdf-body canvas{background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.45);max-width:none}
.his-pdf-msg{color:#fff;padding:24px;font-size:15px}
.his-warn{display:inline-block;margin-top:6px;font-size:11.5px;font-weight:700;color:#8a5a00;background:#FFF3D6;border-radius:6px;padding:2px 8px}
@media(max-width:600px){.his-grid{grid-template-columns:1fr;padding:10px}.his-chip{padding:8px 12px}}`;
  document.head.appendChild(st);
}

// Manuales en Supabase Storage (bucket privado «manuales-his» del proyecto oficial): se abren con enlace temporal dentro de la app.
// Cada fila: [patrón de la fuente, archivo en el bucket, desfase de página (PDF = página citada + desfase), título, ruta de respaldo en el repositorio].


 // Si falla el bucket, abre la copia del repositorio. Poner false cuando el bucket esté verificado.

function hisManual(d) {
  // Recorre las fuentes separadas por «·». Si una cita la NTS 246-2026 (vigente) usa esa; si no, la primera con PDF disponible.
  let primera = null;
  for (const seg of String(d.fuente || "").split("·")) {
    const f = seg.trim();
    const m = HIS_MANUALES.find(([re]) => re.test(f));
    if (!m) continue;
    const pg = /\bpp?\.\s*(\d+)/.exec(f);
    const cita = pg ? parseInt(pg[1], 10) : 1;
    let file = m[1], page = cita + m[2], respaldo = m[4];
    if (m[5]) {
      const t = m[5].find(([hasta]) => cita <= hasta) || m[5][m[5].length - 1];
      file = t[1]; page = cita + t[2]; respaldo = t[3];
    }
    const r = { file, cita, page, titulo: m[3], respaldo: encodeURI(/^data\//.test(respaldo) ? HIS_REPO_PDF.replace(/knowledge\/minsa\/$/, "") + respaldo : HIS_REPO_PDF + respaldo) };
    if (m[5]) return r;
    if (!primera) primera = r;
  }
  return primera;
}
// Guías clínicas: cada diagnóstico CIE-10 abre la guía en la página donde se define su código (verificada en el texto de la guía).

function hisGuia(d) {
  if (d.tipo !== "CIE10") return null;
  const g = HIS_GUIAS.find(([re]) => re.test(String(d.codigo)));
  if (!g) return null;
  return { file: g[1], cita: g[2], page: g[2], titulo: g[3], respaldo: encodeURI(HIS_REPO_PDF.replace(/minsa\/$/, "") + g[4]) };
}

// ----- Visor de PDF dentro de la app (pdf.js): abre el manual en la página exacta -----
let hisPdfLib = null;
function hisPdfLoadLib() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (hisPdfLib) return hisPdfLib;
  hisPdfLib = new Promise((resolve, reject) => {
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    sc.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    sc.onerror = () => { hisPdfLib = null; reject(new Error("pdfjs")); };
    document.head.appendChild(sc);
  });
  return hisPdfLib;
}
// Cliente del proyecto oficial «SERUMS Intelligence Platform» (el mismo del banco de preguntas); no usa auth.js.

let hisPdfClient = null;
async function hisPdfSignedUrl(file) {
  if (!window.supabase || typeof window.supabase.createClient !== "function") throw new Error("sin-supabase");
  if (!hisPdfClient) {
    hisPdfClient = window.supabase.createClient(HIS_PDF_SUPABASE.url, HIS_PDF_SUPABASE.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  const { data, error } = await hisPdfClient.storage.from(HIS_PDF_BUCKET).createSignedUrl(file, 3600);
  if (error || !data || !data.signedUrl) throw new Error("sin-url");
  return data.signedUrl;
}
function hisClosePdf() {
  const ov = document.getElementById("his-pdf");
  if (ov) { document.removeEventListener("keydown", ov._key); ov.remove(); }
}
async function hisOpenPdf(m) {
  hisInjectStyle();
  hisClosePdf();
  const ov = document.createElement("div");
  ov.id = "his-pdf";
  ov.className = "his-pdf";
  ov.innerHTML = `
    <div class="his-pdf-bar">
      <button type="button" class="his-pdf-btn" data-a="close">✕ Cerrar</button>
      <span class="his-pdf-title">${hisEsc(m.titulo)}</span>
      <div class="his-pdf-ctl">
        <button type="button" class="his-pdf-btn" data-a="prev" aria-label="Página anterior">‹</button>
        <span class="his-pdf-pos" id="his-pdf-pos"></span>
        <button type="button" class="his-pdf-btn" data-a="next" aria-label="Página siguiente">›</button>
        <button type="button" class="his-pdf-btn" data-a="zout" aria-label="Alejar">−</button>
        <button type="button" class="his-pdf-btn" data-a="zin" aria-label="Acercar">+</button>
      </div>
    </div>
    <div class="his-pdf-body" id="his-pdf-body"><p class="his-pdf-msg" id="his-pdf-msg">Cargando manual…</p><canvas id="his-pdf-canvas" hidden></canvas></div>`;
  document.body.appendChild(ov);
  const msg = ov.querySelector("#his-pdf-msg");
  const canvas = ov.querySelector("#his-pdf-canvas");
  const body = ov.querySelector("#his-pdf-body");
  const pos = ov.querySelector("#his-pdf-pos");
  let doc = null, num = m.page, zoom = 1, task = null, seq = 0;

  async function draw() {
    const my = ++seq;
    num = Math.max(1, Math.min(doc.numPages, num));
    pos.textContent = "p. " + num + " / " + doc.numPages;
    const pg = await doc.getPage(num);
    if (my !== seq) return;
    const base = pg.getViewport({ scale: 1 });
    const fit = Math.max(280, body.clientWidth - 20) / base.width;
    const vp = pg.getViewport({ scale: fit * zoom });
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(vp.width * ratio);
    canvas.height = Math.floor(vp.height * ratio);
    canvas.style.width = Math.floor(vp.width) + "px";
    canvas.style.height = Math.floor(vp.height) + "px";
    if (task) { try { task.cancel(); } catch (e) { /* ya terminó */ } }
    task = pg.render({ canvasContext: canvas.getContext("2d"), viewport: vp, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null });
    try { await task.promise; } catch (e) { return; }
    body.scrollTop = 0;
  }
  function go(n) { num = n; draw(); }
  ov.addEventListener("click", e => {
    const b = e.target.closest("[data-a]");
    if (!b) return;
    const a = b.dataset.a;
    if (a === "close") hisClosePdf();
    else if (!doc) return;
    else if (a === "prev") go(num - 1);
    else if (a === "next") go(num + 1);
    else if (a === "zin") { zoom = Math.min(3, zoom + 0.25); draw(); }
    else if (a === "zout") { zoom = Math.max(0.5, zoom - 0.25); draw(); }
  });
  ov._key = e => {
    if (e.key === "Escape") hisClosePdf();
    else if (doc && e.key === "ArrowRight") go(num + 1);
    else if (doc && e.key === "ArrowLeft") go(num - 1);
  };
  document.addEventListener("keydown", ov._key);

  try {
    const [lib, url] = await Promise.all([hisPdfLoadLib(), hisPdfSignedUrl(m.file)]);
    doc = await lib.getDocument({ url }).promise;
    if (!document.getElementById("his-pdf")) return;
    msg.hidden = true;
    canvas.hidden = false;
    await draw();
  } catch (err) {
    if (HIS_PDF_RESPALDO_REPO) {
      hisClosePdf();
      window.open(m.respaldo, "_blank", "noopener,noreferrer");
    } else {
      msg.textContent = "No se pudo abrir el manual. Inténtalo de nuevo en unos minutos.";
    }
  }
}

// ── Motor de códigos HIS: carga de datos bajo demanda (core/his-codigos.js) ──
let hisDataPromise = null;
function hisLoadData() {
  if (typeof HIS_GROUPS !== "undefined") return Promise.resolve();
  if (!hisDataPromise) {
    hisDataPromise = new Promise((resolve, reject) => {
      const sc = document.createElement("script");
      const base = new URL(typeof CORE_MODULE_BASE !== "undefined" ? CORE_MODULE_BASE : "core/", location.href);
      sc.src = new URL("his-codigos.js?v=20261118-his", base).href;
      sc.onload = () => resolve();
      sc.onerror = () => { hisDataPromise = null; reject(new Error("his-codigos")); };
      document.head.appendChild(sc);
    });
  }
  return hisDataPromise;
}

// ── Estilos de las tarjetas de grupo (se inyectan una sola vez) ──
function hisInjectGroupStyle() {
  if (document.getElementById("his-groups-style")) return;
  const st = document.createElement("style");
  st.id = "his-groups-style";
  st.textContent = `
    .his-gwrap{margin:0 0 8px}
    .his-gbtn{width:100%;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-left:6px solid #607D8B;border-radius:12px;padding:12px 14px;cursor:pointer;font:inherit;text-align:left;color:var(--ink)}
    .his-gbtn[aria-expanded="true"]{background:#F4FAF7}
    .his-gdot{width:10px;height:10px;border-radius:50%;flex:0 0 auto}
    .his-gname{font-weight:700;font-size:15px;flex:1}
    .his-gn{font-size:12.5px;color:#5B6E6A;white-space:nowrap}
    .his-garrow{font-size:14px;color:#5B6E6A}
    .his-gbody{margin:8px 0 4px 0}
    .his-empty{color:#5B6E6A}`;
  document.head.appendChild(st);
}

async function renderHisCodesChild() {
  hisInjectStyle();
  hisInjectGroupStyle();
  pageTitle.textContent = "Códigos HIS";
  pageSubtitle.textContent = "Buscador de códigos CIE10/CPMS y reglas de registro para la Hoja HIS, con su fuente (manual, año y página).";

  root.innerHTML = `
    <section class="panel">
      <button id="his-back-dashboard" type="button" class="toggle" style="margin:0 0 12px">← Volver al tablero</button>
      <input id="hiscodes-search" class="search" placeholder="Buscar por código, diagnóstico o actividad (ej. J189, CRED, 96150, tamizaje)..." />
      <p class="his-count" id="hiscodes-count" aria-live="polite"></p>
      <div id="hiscodes-list"><p class="his-empty">Cargando códigos…</p></div>
    </section>
    <section class="panel" style="margin-top:14px">
      <h3 class="section-title">Sobre esta tabla</h3>
      <p style="line-height:1.6;color:#5B6E6A">Códigos CIE10/CPMS de la Hoja HIS organizados por grupo. Abre un grupo para ver sus códigos. Cada código indica cómo marcar «Tipo de diagnóstico» y qué anotar en el campo LAB, con el manual y la página de donde sale. Material de consulta: no reemplaza el manual completo del MINSA.</p>
    </section>`;

  const list = document.getElementById("hiscodes-list");
  const search = document.getElementById("hiscodes-search");
  const count = document.getElementById("hiscodes-count");

  try {
    await hisLoadData();
  } catch (e) {
    list.innerHTML = `<p class="his-empty">No se pudieron cargar los códigos HIS. Recarga la página.</p>`;
    return;
  }

  // Niño viene del catálogo sip-data-assistant; el resto, de core/his-codigos.js.
  const all = (data.hisCodigosNino || [])
    .map(d => ({ ...d, grupo: "Niño", fuente: d.fuente || HIS_NINO_SRC, estado: "" }))
    .concat(HIS_EXTRA, HIS_BUCAL, HIS_ADULTO_MAYOR, HIS_ADULTO, HIS_SALUD_MENTAL, HIS_PUEBLOS, HIS_PLANIFICACION, HIS_OCULAR, HIS_ITS, HIS_TBC, HIS_CANCER, HIS_DISCAPACIDAD, HIS_ADOLESCENTE, HIS_METAXENICAS, HIS_ANEMIA, HIS_MATERNO, HIS_EMERGENCIAS, HIS_ZOONOSIS, HIS_DNT, HIS_VACUNAS, HIS_PROMOCION, HIS_TRANSVERSAL);

  // Todo grupo que aparezca en los datos se muestra: primero los de HIS_GROUPS y luego cualquier otro.
  const grupos = [...HIS_GROUPS];
  [...new Set(all.map(d => d.grupo))].forEach(g => { if (!grupos.includes(g)) grupos.push(g); });

  const hisList = [];
  function hisIdx(d) { hisList.push(hisManual(d)); return hisList.length - 1; }
  function hisIdxG(d) { hisList.push(hisGuia(d)); return hisList.length - 1; }

  function card(d) {
    return `
      <article class="his-card">
        <span class="his-code">${hisEsc(d.codigo)}</span><span class="his-tipo ${d.tipo === "CIE10" ? "cie" : d.tipo === "ÉTNICO" ? "etn" : "cpms"}">${hisEsc(d.tipo)}</span>
        <h4>${hisEsc(d.descripcion)}</h4>
        ${d.notaRegistro ? `<p class="his-nota"><strong>Registro:</strong> ${hisEsc(d.notaRegistro)}</p>` : ""}
        ${d.estado ? `<span class="his-warn">⚠ ${hisEsc(d.estado)}</span>` : ""}
        <p class="his-src">📖 ${hisEsc(d.fuente)}</p>
        ${hisManual(d) ? `<button type="button" class="his-link" data-i="${hisIdx(d)}">📄 Abrir manual (p. ${hisManual(d).cita})</button>` : ""}
        ${hisGuia(d) ? `<button type="button" class="his-link" data-i="${hisIdxG(d)}">📘 Guía clínica (p. ${hisGuia(d).cita})</button>` : ""}
      </article>`;
  }

  const openSet = new Set();
  let query = "";

  function draw() {
    hisList.length = 0;
    const q = hisNorm(query.trim());
    const filtered = all.filter(d => !q || hisNorm([d.codigo, d.codigo.replace(/\./g, ""), d.descripcion, d.categoria, d.tipo, d.notaRegistro, d.grupo].join(" ")).includes(q));
    count.textContent = q
      ? (filtered.length ? `${filtered.length} código${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}` : "Sin resultados")
      : `${all.length} códigos en ${grupos.length} grupos`;

    list.innerHTML = grupos.map(g => {
      const items = filtered.filter(d => d.grupo === g);
      if (q && !items.length) return "";
      const open = !!(openSet.has(g) || (q && items.length > 0));
      const color = (typeof HIS_GROUP_COLORS !== "undefined" && HIS_GROUP_COLORS[g]) || "#607D8B";
      const body = open ? `<div class="his-gbody"><div class="his-grid">${items.map(card).join("")}</div></div>` : "";
      return `
        <div class="his-gwrap">
          <button type="button" class="his-gbtn" data-g="${hisEsc(g)}" aria-expanded="${open}" style="border-left-color:${color}">
            <span class="his-gdot" style="background:${color}"></span>
            <span class="his-gname">${hisEsc(g)}</span>
            <span class="his-gn">${items.length} código${items.length === 1 ? "" : "s"}</span>
            <span class="his-garrow">${open ? "▾" : "▸"}</span>
          </button>
          ${body}
        </div>`;
    }).join("") || `<p class="his-empty">No hay códigos con ese filtro.</p>`;
  }

  search.addEventListener("input", () => { query = search.value; draw(); });
  list.addEventListener("click", e => {
    const g = e.target.closest(".his-gbtn");
    if (g) {
      const name = g.dataset.g;
      if (openSet.has(name)) openSet.delete(name); else openSet.add(name);
      draw();
      return;
    }
    const b = e.target.closest("[data-i]");
    if (b && hisList[+b.dataset.i]) hisOpenPdf(hisList[+b.dataset.i]);
  });
  document.getElementById("his-back-dashboard").addEventListener("click", () => { hisClosePdf(); renderView("dashboard"); });

  draw();
}
