// ===== Repasar hoy: repaso espaciado + exportar/importar progreso =====
// Lee caseState (Entrenamiento por casos) y simulacroHistory (Simulacro). Solo escribe en caseState al responder un repaso.
// Formato de respaldo versionado: {app, version, exportadoEn, datos}. Si cambia la estructura, sube RV_FORMAT.version.
const RV_INTERVALS = [1, 3, 7, 14, 30]; // días hasta el próximo repaso según aciertos seguidos desde el último fallo
const RV_SESSION_MAX = 15;
const RV_FORMAT = { app: "SERUM-APP", version: 1 };
let rvSession = null;

function rvEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function rvDayStart(t) { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
function rvAddDays(dayStart, n) { const d = new Date(dayStart); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime(); }
function rvFmtDate(t) { return new Date(t).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }); }
function rvToday() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

function rvInjectStyle() {
  if (document.getElementById("rv-style")) return;
  const st = document.createElement("style");
  st.id = "rv-style";
  st.textContent = `
.rv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.rv-stat{border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px 10px;text-align:center}
.rv-stat b{display:block;font-size:26px;color:var(--primary-dark)}
.rv-stat span{font-size:12px;color:var(--muted)}
.rv-stat.hot b{color:var(--red)}
.rv-rows{margin:8px 0 0;padding:0;list-style:none}
.rv-rows li{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:14px}
.rv-rows li:last-child{border-bottom:0}
.rv-note{font-size:13px;color:var(--muted);line-height:1.5;margin:8px 0 0}
.rv-warn{color:#8a5a00;background:#FFF3D6;border-radius:8px;padding:8px 10px;font-size:13px;margin:8px 0 0}
.rv-ok{color:#1B7A4D;background:#EAF6EF;border-radius:8px;padding:8px 10px;font-size:13px;margin:8px 0 0}
.rv-err{color:#B3261E;background:#FCEBEA;border-radius:8px;padding:8px 10px;font-size:13px;margin:8px 0 0}
.rv-btns{display:flex;flex-wrap:wrap;gap:10px}
.rv-btns .action-btn{margin-top:8px;margin-left:0}
.rv-opts{display:grid;gap:8px;margin:12px 0}
.rv-meta{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:700}
.rv-fb{border-left:4px solid var(--primary);background:#F6F9F8;padding:10px 12px;border-radius:8px;font-size:14px;line-height:1.5;margin:10px 0}
.rv-bar{height:6px;background:#E5ECEA;border-radius:999px;overflow:hidden;margin:6px 0 12px}
.rv-bar i{display:block;height:100%;background:var(--primary)}
@media(max-width:600px){.rv-stat b{font-size:22px}}`;
  document.head.appendChild(st);
}

// ---------- Lectura de historiales ----------
function rvCollectEvents() {
  const ev = new Map();
  const add = (id, t, ok) => {
    if (id == null || Number.isNaN(t)) return;
    const k = String(id);
    if (!ev.has(k)) ev.set(k, []);
    ev.get(k).push({ t, ok });
  };
  Object.entries(caseState || {}).forEach(([id, st]) => {
    ((st && st.history) || []).forEach(h => add(id, Date.parse(h.date), !!h.correct));
  });
  (simulacroHistory || []).forEach(r => {
    const t = Date.parse(r.date);
    ((r && r.answers) || []).forEach(a => {
      if (!a || a.unanswered || a.selected == null) return;
      add(a.caseId, t, !!a.correct);
    });
  });
  return ev;
}

function rvBuildSchedule() {
  const today = rvDayStart(Date.now());
  const byId = new Map((data.cases || []).map(c => [String(c.id), c]));
  const items = [];
  let missing = 0;
  rvCollectEvents().forEach((list, id) => {
    list.sort((a, b) => a.t - b.t);
    let streak = 0, fails = 0;
    list.forEach(e => { if (e.ok) streak++; else { streak = 0; fails++; } });
    if (!fails) return; // solo se repasan las preguntas que alguna vez se fallaron
    const q = byId.get(id);
    if (!q) { missing++; return; }
    const last = list[list.length - 1].t;
    const dominated = streak >= RV_INTERVALS.length;
    const next = dominated ? null : rvAddDays(rvDayStart(last), RV_INTERVALS[streak]);
    items.push({ id, q, streak, fails, last, next, dominated, due: !dominated && next <= today });
  });
  const due = items.filter(i => i.due).sort((a, b) => a.next - b.next || b.fails - a.fails);
  return { items, due, missing, today };
}

// ---------- Vista principal ----------
function renderReview() {
  rvInjectStyle();
  rvSession = null;
  pageTitle.textContent = "Repasar hoy";
  pageSubtitle.textContent = "Repaso espaciado de las preguntas que fallaste: vuelven a los 1, 3, 7, 14 y 30 días. Usa lo que ya resolviste en el Simulacro y en el Entrenamiento por casos.";
  const sch = rvBuildSchedule();
  const tracking = sch.items.filter(i => !i.dominated).length;
  const dominated = sch.items.filter(i => i.dominated).length;

  const byBlock = {};
  sch.due.forEach(i => { byBlock[i.q.block] = (byBlock[i.q.block] || 0) + 1; });
  const blockRows = Object.entries(byBlock).sort((a, b) => b[1] - a[1])
    .map(([b, n]) => `<li><span>${rvEsc(b)}</span><b>${n}</b></li>`).join("");

  const upcoming = {};
  sch.items.filter(i => !i.dominated && i.next > sch.today && i.next <= rvAddDays(sch.today, 7))
    .forEach(i => { upcoming[i.next] = (upcoming[i.next] || 0) + 1; });
  const upRows = Object.entries(upcoming).sort((a, b) => a[0] - b[0])
    .map(([t, n]) => `<li><span>${rvFmtDate(Number(t))}</span><b>${n}</b></li>`).join("");

  const lastExport = localStorage.getItem("rvLastExport");
  const daysSince = lastExport ? Math.floor((Date.now() - Date.parse(lastExport)) / 86400000) : null;
  const backupMsg = !lastExport
    ? `<div class="rv-warn">Aún no has guardado ningún respaldo. Tu progreso vive solo en este navegador.</div>`
    : daysSince >= 7
      ? `<div class="rv-warn">Tu último respaldo fue hace ${daysSince} días (${rvFmtDate(Date.parse(lastExport))}). Conviene guardar uno nuevo.</div>`
      : `<div class="rv-ok">Último respaldo: ${rvFmtDate(Date.parse(lastExport))}.</div>`;

  root.innerHTML = `
    <section class="rv-stats">
      <div class="rv-stat ${sch.due.length ? "hot" : ""}"><b>${sch.due.length}</b><span>Para repasar hoy</span></div>
      <div class="rv-stat"><b>${tracking}</b><span>En seguimiento</span></div>
      <div class="rv-stat"><b>${dominated}</b><span>Dominadas</span></div>
    </section>
    <section class="panel">
      <h3 class="section-title">Repaso de hoy</h3>
      ${sch.due.length ? `
        <p class="rv-note">Hoy toca repasar ${sch.due.length} pregunta${sch.due.length === 1 ? "" : "s"}. Cada sesión trae hasta ${RV_SESSION_MAX}.</p>
        <ul class="rv-rows">${blockRows}</ul>
        <button id="rv-start" class="action-btn" type="button">Empezar repaso (${Math.min(sch.due.length, RV_SESSION_MAX)})</button>`
      : `<p class="rv-note">${sch.items.length
          ? "No tienes repasos pendientes hoy. ¡Buen trabajo!"
          : "Aún no hay preguntas falladas para repasar. Resuelve un simulacro o casos de entrenamiento y vuelve aquí."}</p>`}
      ${upRows ? `<h4 style="margin:16px 0 0;font-size:14px;color:var(--ink)">Próximos 7 días</h4><ul class="rv-rows">${upRows}</ul>` : ""}
      ${sch.missing ? `<p class="rv-note">${sch.missing} pregunta${sch.missing === 1 ? "" : "s"} del historial no se encontraron en el banco cargado y no se incluyen.</p>` : ""}
    </section>
    <section class="panel" style="margin-top:14px">
      <h3 class="section-title">Guardar y llevar tu progreso</h3>
      <p class="rv-note">Tu progreso se guarda solo en este aparato y navegador. Para llevarlo a otro celular o a la PC, o como copia de seguridad, expórtalo a un archivo e impórtalo donde lo necesites. Al importar, se combina con lo que ya tengas: no se borra nada.</p>
      ${backupMsg}
      <div class="rv-btns">
        <button id="rv-export" class="action-btn" type="button">Guardar / Exportar progreso</button>
        <button id="rv-import" class="action-btn secondary" type="button">Importar progreso</button>
        <input id="rv-file" type="file" accept=".json,application/json" style="display:none">
      </div>
      <div id="rv-status" aria-live="polite"></div>
    </section>`;

  const start = document.getElementById("rv-start");
  if (start) start.addEventListener("click", () => rvStart(sch.due.slice(0, RV_SESSION_MAX)));
  document.getElementById("rv-export").addEventListener("click", rvExport);
  const file = document.getElementById("rv-file");
  document.getElementById("rv-import").addEventListener("click", () => file.click());
  file.addEventListener("change", () => { if (file.files[0]) rvImport(file.files[0]); file.value = ""; });
}

// ---------- Sesión de repaso ----------
function rvShuffled(q) {
  const idx = q.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return { ...q, options: idx.map(i => q.options[i]), correct: idx.indexOf(q.correct) };
}

function rvStart(due) {
  rvSession = { queue: due.map(i => rvShuffled(i.q)), i: 0, selected: null, confirmed: false, right: 0, wrong: [] };
  rvRenderQuestion();
}

function rvRenderQuestion() {
  const s = rvSession;
  const q = s.queue[s.i];
  const letters = "ABCDEFGH";
  const opts = q.options.map((o, i) => {
    let cls = "option-btn";
    if (s.confirmed) { if (i === q.correct) cls += " success"; else if (i === s.selected) cls += " error"; }
    else if (i === s.selected) cls += " selected";
    return `<button type="button" class="${cls}" data-i="${i}" ${s.confirmed ? "disabled" : ""}><b>${letters[i]}.</b> ${rvEsc(o)}</button>`;
  }).join("");
  const ok = s.confirmed && s.selected === q.correct;
  root.innerHTML = `
    <section class="panel">
      <div class="rv-meta">Repaso ${s.i + 1} de ${s.queue.length} · ${rvEsc(q.block || "")}</div>
      <div class="rv-bar"><i style="width:${Math.round((s.i / s.queue.length) * 100)}%"></i></div>
      <h3 class="section-title" style="font-size:17px">${rvEsc(q.title || "")}</h3>
      <p style="line-height:1.55">${rvEsc(q.statement || "")}</p>
      <p style="line-height:1.55"><strong>${rvEsc(q.question || "")}</strong></p>
      <div class="rv-opts">${opts}</div>
      ${s.confirmed ? `<div class="${ok ? "rv-ok" : "rv-err"}">${ok ? "Correcto" : "Incorrecto: la respuesta era la " + letters[q.correct]}</div>
        ${q.feedback ? `<div class="rv-fb">${rvEsc(q.feedback)}</div>` : ""}` : ""}
      <div class="rv-btns">
        ${s.confirmed
          ? `<button id="rv-next" class="action-btn" type="button">${s.i + 1 < s.queue.length ? "Siguiente →" : "Ver resultado"}</button>`
          : `<button id="rv-confirm" class="action-btn" type="button" ${s.selected === null ? "disabled" : ""}>Confirmar respuesta</button>`}
        <button id="rv-exit" class="action-btn secondary" type="button">Salir del repaso</button>
      </div>
    </section>`;
  root.querySelectorAll(".rv-opts .option-btn").forEach(b => b.addEventListener("click", () => {
    if (s.confirmed) return;
    s.selected = Number(b.dataset.i);
    rvRenderQuestion();
  }));
  const c = document.getElementById("rv-confirm");
  if (c) c.addEventListener("click", rvConfirm);
  const n = document.getElementById("rv-next");
  if (n) n.addEventListener("click", rvNext);
  document.getElementById("rv-exit").addEventListener("click", renderReview);
}

function rvConfirm() {
  const s = rvSession;
  if (s.confirmed || s.selected === null) return;
  const q = s.queue[s.i];
  const ok = s.selected === q.correct;
  s.confirmed = true;
  if (ok) s.right += 1; else s.wrong.push(q);
  const st = caseState[q.id] || { attempts: 0, correct: false, history: [] };
  st.attempts = (st.attempts || 0) + 1;
  st.correct = st.correct || ok;
  st.history = st.history || [];
  st.history.push({ date: new Date().toISOString(), selectedIndex: s.selected, correct: ok });
  st.lastAttemptDate = st.history[st.history.length - 1].date;
  caseState[q.id] = st;
  saveProgress(data.caseStateKey, caseState);
  updateBadges();
  rvRenderQuestion();
}

function rvNext() {
  const s = rvSession;
  s.i += 1; s.selected = null; s.confirmed = false;
  if (s.i < s.queue.length) rvRenderQuestion(); else rvRenderEnd();
}

function rvRenderEnd() {
  const s = rvSession;
  const total = s.queue.length;
  const pct = Math.round((s.right / total) * 100);
  root.innerHTML = `
    <section class="panel">
      <h3 class="section-title">Repaso terminado</h3>
      <div class="rv-stats">
        <div class="rv-stat"><b>${s.right}/${total}</b><span>Aciertos</span></div>
        <div class="rv-stat"><b>${pct}%</b><span>Porcentaje</span></div>
        <div class="rv-stat ${s.wrong.length ? "hot" : ""}"><b>${s.wrong.length}</b><span>Vuelven mañana</span></div>
      </div>
      <p class="rv-note">Las que acertaste se repetirán más adelante (3, 7, 14 y 30 días). Las que fallaste vuelven a empezar el ciclo mañana.</p>
      ${s.wrong.length ? `<ul class="rv-rows">${s.wrong.map(q => `<li><span>${rvEsc(q.title || "")}</span><b>${rvEsc(q.block || "")}</b></li>`).join("")}</ul>` : ""}
      <button id="rv-back" class="action-btn" type="button">Volver a Repasar hoy</button>
    </section>`;
  document.getElementById("rv-back").addEventListener("click", renderReview);
  rvSession = null;
}

// ---------- Exportar / Importar ----------
function rvStatus(kind, msg) {
  const el = document.getElementById("rv-status");
  if (el) el.innerHTML = `<div class="${kind}">${rvEsc(msg)}</div>`;
}

function rvBuildExport() {
  return {
    app: RV_FORMAT.app,
    version: RV_FORMAT.version,
    exportadoEn: new Date().toISOString(),
    datos: {
      caseState, simulacroHistory, score, notes, trainingState, assistantPracticeState,
      simulacroCareer: simulacroCareer || "",
      userName: localStorage.getItem("preserum_userName") || ""
    }
  };
}

function rvExport() {
  try {
    const payload = rvBuildExport();
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "serum-app-progreso-" + rvToday() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    localStorage.setItem("rvLastExport", payload.exportadoEn);
    const nCases = Object.keys(caseState || {}).length;
    rvStatus("rv-ok", "Archivo generado: " + nCases + " casos y " + (simulacroHistory || []).length + " simulacros. Guárdalo en un lugar seguro (Descargas, Drive o tu correo).");
  } catch (e) {
    rvStatus("rv-err", "No se pudo generar el archivo. Intenta de nuevo.");
  }
}

function rvIsObj(x) { return x && typeof x === "object" && !Array.isArray(x); }

function rvMerge(d) {
  const cs = { ...caseState };
  Object.entries(rvIsObj(d.caseState) ? d.caseState : {}).forEach(([id, b]) => {
    if (id === "__proto__" || !rvIsObj(b)) return;
    const a = cs[id];
    if (!a) { cs[id] = b; return; }
    const seen = new Set((a.history || []).map(h => h.date + "|" + h.selectedIndex));
    const hist = [...(a.history || [])];
    (b.history || []).forEach(h => { if (h && !seen.has(h.date + "|" + h.selectedIndex)) hist.push(h); });
    hist.sort((x, y) => Date.parse(x.date) - Date.parse(y.date));
    cs[id] = { ...a, history: hist, attempts: Math.max(a.attempts || 0, b.attempts || 0, hist.length), correct: !!(a.correct || b.correct), lastAttemptDate: hist.length ? hist[hist.length - 1].date : a.lastAttemptDate };
  });
  const dates = new Set((simulacroHistory || []).map(r => r.date));
  const sims = [...(simulacroHistory || [])];
  (Array.isArray(d.simulacroHistory) ? d.simulacroHistory : []).forEach(r => { if (rvIsObj(r) && !dates.has(r.date)) sims.push(r); });
  sims.sort((x, y) => Date.parse(x.date) - Date.parse(y.date));

  caseState = cs;
  saveProgress(data.caseStateKey, caseState);
  simulacroHistory = sims;
  saveProgress("simulacroHistory", simulacroHistory);
  score = Math.max(score, Number(d.score) || 0);
  localStorage.setItem(data.scoreKey, String(score));
  if (!notes && typeof d.notes === "string" && d.notes) { notes = d.notes; localStorage.setItem(data.notesKey, notes); }
  if (rvIsObj(d.trainingState)) { trainingState = { ...d.trainingState, ...trainingState }; saveProgress("trainingState", trainingState); }
  if (rvIsObj(d.assistantPracticeState)) { assistantPracticeState = { ...d.assistantPracticeState, ...assistantPracticeState }; saveProgress("assistantPracticeState", assistantPracticeState); }
  if (!simulacroCareer && typeof d.simulacroCareer === "string" && d.simulacroCareer) { simulacroCareer = d.simulacroCareer; localStorage.setItem("simulacroCareer", simulacroCareer); }
  if (!localStorage.getItem("preserum_userName") && typeof d.userName === "string" && d.userName) localStorage.setItem("preserum_userName", d.userName);
  updateBadges();
}

async function rvImport(file) {
  let parsed;
  try { parsed = JSON.parse(await file.text()); }
  catch (e) { rvStatus("rv-err", "El archivo no se pudo leer. Elige un archivo de progreso exportado desde SERUM-APP."); return; }
  if (!rvIsObj(parsed) || parsed.app !== RV_FORMAT.app || !rvIsObj(parsed.datos)) {
    rvStatus("rv-err", "Este archivo no es un respaldo de SERUM-APP."); return;
  }
  if (typeof parsed.version !== "number" || parsed.version > RV_FORMAT.version) {
    rvStatus("rv-err", "Este respaldo es de una versión más nueva de la app. Actualiza la app e inténtalo otra vez."); return;
  }
  const d = parsed.datos;
  const nc = rvIsObj(d.caseState) ? Object.keys(d.caseState).length : 0;
  const ns = Array.isArray(d.simulacroHistory) ? d.simulacroHistory.length : 0;
  if (!window.confirm("El archivo trae " + nc + " casos y " + ns + " simulacros. Se combinarán con tu progreso actual y no se borra nada. ¿Continuar?")) return;
  try {
    rvMerge(d);
    renderReview();
    rvStatus("rv-ok", "Progreso importado y combinado: " + Object.keys(caseState).length + " casos y " + simulacroHistory.length + " simulacros en este aparato.");
  } catch (e) {
    rvStatus("rv-err", "No se pudo importar el archivo.");
  }
}
