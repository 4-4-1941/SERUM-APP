// ===== Mis notas: dudas y recordatorios con casilla de pendiente / resuelta =====
// Datos en la clave "myNotesList" (ver myNotesLoad en sip-state.js). Se incluyen en Exportar/Importar progreso.
let ntFilter = "pendientes";
let ntList = [];

function ntEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function ntFmt(iso) { const t = Date.parse(iso); return Number.isNaN(t) ? "" : new Date(t).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }); }
function ntSave() { saveProgress("myNotesList", ntList); }

function ntInjectStyle() {
  if (document.getElementById("nt-style")) return;
  const st = document.createElement("style");
  st.id = "nt-style";
  st.textContent = `
.nt-add{display:grid;gap:8px}
.nt-add textarea{min-height:70px;resize:vertical}
.nt-chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 8px}
.nt-chip{border:1px solid var(--line);background:#FBFDFC;color:var(--ink);border-radius:999px;padding:8px 14px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
.nt-chip[aria-pressed="true"]{background:var(--primary);border-color:var(--primary);color:#fff}
.nt-item{display:flex;gap:12px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px;margin:0 0 10px}
.nt-item.done{background:#F6F9F8}
.nt-item.done .nt-text{text-decoration:line-through;color:var(--muted)}
.nt-check{width:24px;height:24px;flex:none;margin-top:2px;accent-color:var(--primary);cursor:pointer}
.nt-body{flex:1;min-width:0}
.nt-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;font-size:14.5px}
.nt-meta{font-size:12px;color:var(--muted);margin-top:4px}
.nt-actions{display:flex;gap:14px;margin-top:6px}
.nt-mini{border:0;background:none;padding:6px 0;font:inherit;font-size:13px;font-weight:600;color:var(--primary-dark);cursor:pointer}
.nt-mini.del{color:#B3261E}
.nt-empty{color:var(--muted);font-size:14px;line-height:1.5;padding:6px 0}
.nt-msg{font-size:13px;margin-top:6px}`;
  document.head.appendChild(st);
}

function renderNotes() {
  ntInjectStyle();
  ntList = myNotesLoad();
  pageTitle.textContent = "Mis notas";
  pageSubtitle.textContent = "Dudas y recordatorios de estudio. Marca la casilla cuando una duda quedó resuelta.";
  root.innerHTML = `
    <section class="panel">
      <div class="nt-add">
        <textarea id="nt-input" class="input" placeholder="Escribe una duda o un recordatorio (ej. repasar norma de tamizaje en niños)..."></textarea>
        <div><button id="nt-add" class="action-btn" type="button">Agregar nota</button></div>
      </div>
      <div id="nt-msg" class="nt-msg" aria-live="polite"></div>
      <div class="nt-chips" id="nt-chips"></div>
      <div id="nt-list"></div>
    </section>`;
  document.getElementById("nt-add").addEventListener("click", ntAdd);
  document.getElementById("nt-chips").addEventListener("click", e => {
    const b = e.target.closest(".nt-chip");
    if (!b) return;
    ntFilter = b.dataset.f;
    ntDraw();
  });
  document.getElementById("nt-list").addEventListener("click", ntListClick);
  document.getElementById("nt-list").addEventListener("change", ntListChange);
  ntDraw();
}

function ntMsg(text, ok) {
  const el = document.getElementById("nt-msg");
  if (el) { el.textContent = text; el.style.color = ok ? "#1B7A4D" : "#B3261E"; }
}

function ntAdd() {
  const input = document.getElementById("nt-input");
  const text = input.value.trim();
  if (!text) { ntMsg("Escribe algo antes de agregar la nota.", false); return; }
  ntList.unshift({ id: myNotesId(), text: text.slice(0, 2000), done: false, created: new Date().toISOString(), doneAt: null });
  ntSave();
  input.value = "";
  ntFilter = "pendientes";
  ntMsg("Nota guardada.", true);
  ntDraw();
}

function ntDraw() {
  const pend = ntList.filter(n => !n.done);
  const done = ntList.filter(n => n.done);
  const chip = (f, label, n) => `<button type="button" class="nt-chip" data-f="${f}" aria-pressed="${ntFilter === f}">${label} (${n})</button>`;
  document.getElementById("nt-chips").innerHTML = chip("pendientes", "Pendientes", pend.length) + chip("resueltas", "Resueltas", done.length) + chip("todas", "Todas", ntList.length);

  const byDate = (a, b) => Date.parse(b.created) - Date.parse(a.created);
  const shown = ntFilter === "pendientes" ? pend.slice().sort(byDate)
    : ntFilter === "resueltas" ? done.slice().sort((a, b) => Date.parse(b.doneAt || 0) - Date.parse(a.doneAt || 0))
    : pend.slice().sort(byDate).concat(done.slice().sort((a, b) => Date.parse(b.doneAt || 0) - Date.parse(a.doneAt || 0)));

  const empty = ntFilter === "pendientes" ? (ntList.length ? "No tienes dudas pendientes. ¡Buen trabajo!" : "Aún no tienes notas. Escribe tu primera duda arriba.")
    : ntFilter === "resueltas" ? "Todavía no has marcado dudas como resueltas." : "Aún no tienes notas.";

  document.getElementById("nt-list").innerHTML = shown.length ? shown.map(n => `
    <article class="nt-item ${n.done ? "done" : ""}" data-id="${ntEsc(n.id)}">
      <input type="checkbox" class="nt-check" ${n.done ? "checked" : ""} aria-label="${n.done ? "Marcar como pendiente" : "Marcar como resuelta"}">
      <div class="nt-body">
        <div class="nt-text">${ntEsc(n.text)}</div>
        <div class="nt-meta">${n.done ? "Resuelta " + ntEsc(ntFmt(n.doneAt)) + " · " : ""}Agregada ${ntEsc(ntFmt(n.created))}</div>
        <div class="nt-actions">
          <button type="button" class="nt-mini" data-act="edit">Editar</button>
          <button type="button" class="nt-mini del" data-act="del">Eliminar</button>
        </div>
      </div>
    </article>`).join("") : `<p class="nt-empty">${empty}</p>`;
}

function ntFind(el) {
  const art = el.closest(".nt-item");
  return art ? ntList.find(n => n.id === art.dataset.id) : null;
}

function ntListChange(e) {
  if (!e.target.classList.contains("nt-check")) return;
  const n = ntFind(e.target);
  if (!n) return;
  n.done = e.target.checked;
  n.doneAt = n.done ? new Date().toISOString() : null;
  ntSave();
  ntMsg(n.done ? "Marcada como resuelta." : "Vuelve a estar pendiente.", true);
  ntDraw();
}

function ntListClick(e) {
  const b = e.target.closest(".nt-mini");
  if (!b) return;
  const n = ntFind(b);
  if (!n) return;
  if (b.dataset.act === "edit") {
    const text = window.prompt("Editar nota", n.text);
    if (text === null) return;
    if (!text.trim()) { ntMsg("La nota no puede quedar vacía.", false); return; }
    n.text = text.trim().slice(0, 2000);
    ntSave(); ntMsg("Nota actualizada.", true); ntDraw();
  } else if (b.dataset.act === "del") {
    if (!window.confirm("¿Eliminar esta nota?")) return;
    ntList = ntList.filter(x => x.id !== n.id);
    ntSave(); ntMsg("Nota eliminada.", true); ntDraw();
  }
}
