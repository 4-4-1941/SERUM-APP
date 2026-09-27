/*
 * Banco SERUMS por profesión
 *
 * Carga módulos de forma diferida: el banco completo nunca se descarga al
 * iniciar la aplicación.  No modifica window.SERUMS_DATA ni los casos
 * existentes a menos que un módulo consumidor lo solicite expresamente.
 */
(() => {
  "use strict";

  const scriptUrl = document.currentScript && document.currentScript.src;
  const BASE_URL = new URL("../banco-preguntas/profesiones/", scriptUrl || window.location.href);
  const INDEX_FILE = "index-modulos-profesion.json";
  // Este cliente es exclusivamente para el banco educativo publicado en
  // SERUMS INTELLIGENCE PLATFORM. No reutiliza auth.js, porque aquel módulo
  // conserva la configuración de autenticación histórica de la aplicación.
  const REMOTE_CONFIG = Object.freeze({
    url: "https://xcfdhwqjudzngvlssyeg.supabase.co",
    publishableKey: "sb_publishable_SMfnQmaqkzsFXn23qDriEQ_tG-Xb_Jd",
    table: "cases",
    sourceTag: "source:SERUM-APP"
  });
  const indexPromise = fetch(new URL(INDEX_FILE, BASE_URL), { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo leer el índice del banco (${response.status}).`);
      return response.json();
    });
  const moduleCache = new Map();
  const remoteModuleCache = new Map();
  let remoteProfessionPromise = null;

  function asArray(payload) {
    if (Array.isArray(payload)) return payload;
    return payload.modules || payload.questions || payload.cases || payload.items || [];
  }

  function normalize(item) {
    const alternatives = Array.isArray(item.alternatives) ? item.alternatives : item.options;
    const answer = item.declared_answer ?? item.correct ?? item.answer;
    return {
      id: item.canonical_id || item.id,
      career: item.profession || item.career || item.specialty,
      specialty: item.specialty || "",
      block: item.thematic_block || item.block || "",
      level: item.difficulty || item.level || "",
      title: item.title || item.statement || "Caso SERUMS",
      statement: item.statement || "",
      question: item.question || item.statement || "",
      options: alternatives || [],
      correct: answer,
      feedback: item.justification || item.feedback || "",
      status: item.status || "UNSPECIFIED",
      source: item.origin || item.catalog_source || "banco-profesiones"
    };
  }

  function parseJson(value, fallback) {
    if (value == null) return fallback;
    if (typeof value !== "string") return value;
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function remoteClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("La biblioteca de Supabase no está disponible.");
    }
    return window.supabase.createClient(REMOTE_CONFIG.url, REMOTE_CONFIG.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  function normalizeRemote(row) {
    const tags = parseJson(row.tags, []);
    const options = parseJson(row.options, []);
    return {
      // Los casos locales 503–554 ya existen. El prefijo evita que un caso
      // remoto reemplace su progreso, sus botones o su registro local.
      id: `bank:${row.id}`,
      sourceId: row.id,
      career: row.career || row.specialty || "Sin profesión",
      specialty: row.specialty || "",
      block: row.block || "",
      level: row.level || "",
      title: row.title || row.statement || "Pregunta SERUMS",
      statement: row.statement || "",
      question: row.question || row.statement || "",
      options: Array.isArray(options) ? options : [],
      correct: Number(row.correct),
      feedback: row.feedback || "",
      tags: Array.isArray(tags) ? tags : [],
      unverified: row.unverified !== false,
      status: row.estado || "REVIEW_REQUIRED",
      requiere_validacion_humana: row.requiere_validacion_humana !== false,
      source: "supabase:SERUM-APP"
    };
  }

  const CACHE_MS = 60000;
  let snapshot = null;
  let snapshotAt = 0;
  let snapshotPromise = null;
  const loadedProfessions = new Set();

  function isUsable(row) {
    const options = parseJson(row.options, []);
    if (!Array.isArray(options) || ![4, 5].includes(options.length)) return false;
    if (!Number.isInteger(row.correct) || row.correct < 0 || row.correct >= options.length) return false;
    if (!row.statement || !row.question || !row.feedback) return false;
    if (["placeholder", "requiere_contexto", "rechazado", "archivado"].includes(row.estado)) return false;
    if (options.some(option => typeof option !== "string" || !option.trim())) return false;
    if (new Set(options.map(option => option.trim().toLocaleLowerCase("es"))).size !== options.length) return false;
    return !options.some(option => /opci[oó]n falsa|incorrecto\s*\d+|placeholder|opci[oó]n correcta|[✓✔☑]/i.test(option));
  }

  async function remoteRows(force = false) {
    if (snapshotPromise) return snapshotPromise;
    if (!force && snapshot && Date.now() - snapshotAt < CACHE_MS) return snapshot;
    snapshotPromise = (async () => {
      const client = remoteClient();
      const result = [];
      // Continue until an empty page, including servers configured below 500 rows.
      for (let from = 0; ; ) {
        const { data, error } = await client.from(REMOTE_CONFIG.table)
          .select("*").contains("tags", JSON.stringify([REMOTE_CONFIG.sourceTag]))
          .order("id", { ascending: true }).range(from, from + 499);
        if (error) throw new Error(`No se pudo sincronizar el banco: ${error.message}`);
        if (!Array.isArray(data)) throw new Error("Respuesta inválida del banco remoto.");
        if (!data.length) break;
        result.push(...data);
        from += data.length;
      }
      const unique = new Map(result.filter(isUsable).map(row => [String(row.id), row]));
      snapshot = [...unique.values()];
      snapshotAt = Date.now();
      return snapshot;
    })();
    try { return await snapshotPromise; }
    finally { snapshotPromise = null; }
  }

  async function listRemoteProfessions() {
    const counts = new Map();
    for (const row of await remoteRows()) counts.set(row.career, (counts.get(row.career) || 0) + 1);
    return [...counts].map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => a.profession.localeCompare(b.profession, "es"));
  }

  async function loadRemoteProfession(profession) {
    if (!profession) throw new Error("Debes indicar una profesión.");
    return (await remoteRows()).filter(row => row.career === profession).map(normalizeRemote);
  }

  function reconcile(target, incoming, profession) {
    const previous = new Set(target.map(item => String(item.id)));
    const keep = target.filter(item => !(item.source === "supabase:SERUM-APP" &&
      (!profession || item.career === profession)));
    const ids = new Set(keep.map(item => String(item.id)));
    for (const item of incoming) {
      if (!ids.has(String(item.id))) { keep.push(item); ids.add(String(item.id)); }
    }
    target.splice(0, target.length, ...keep);
    return incoming.filter(item => !previous.has(String(item.id))).length;
  }

  async function mergeRemoteProfession(profession, options = {}) {
    const target = options.target || (window.SERUMS_DATA && window.SERUMS_DATA.cases);
    if (!Array.isArray(target)) throw new Error("No hay colección de casos operativa para integrar.");
    const incoming = await loadRemoteProfession(profession);
    const added = reconcile(target, incoming, profession);
    loadedProfessions.add(profession);
    return { profession, loaded: incoming.length, added, skipped: incoming.length - added };
  }

  function isRemoteProfessionLoaded(profession) {
    return Date.now() - snapshotAt < CACHE_MS && loadedProfessions.has(profession);
  }

  async function listProfessions() {
    const index = await indexPromise;
    return asArray(index).map((item) => ({
      profession: item.profession || item.name || item.career,
      file: item.file || item.path,
      count: item.count || item.total_questions || item.questions || item.total || 0
    })).filter((item) => item.profession && item.file);
  }

  async function loadProfession(profession, options = {}) {
    // El banco se mantiene disponible por profesión. El estado de revisión se
    // conserva en cada caso para que la interfaz pueda advertirlo sin ocultar
    // el material formativo ni descargar módulos ajenos.
    const { includeReviewRequired = true } = options;
    const modules = await listProfessions();
    const module = modules.find((item) => item.profession === profession);
    if (!module) throw new Error(`No existe un módulo para la profesión: ${profession}.`);

    if (!moduleCache.has(module.file)) {
      moduleCache.set(module.file, fetch(new URL(module.file, BASE_URL), { cache: "force-cache" })
        .then((response) => {
          if (!response.ok) throw new Error(`No se pudo cargar ${module.file} (${response.status}).`);
          return response.json();
        })
        .then(asArray)
        .then((items) => items.map(normalize)));
    }

    const cases = await moduleCache.get(module.file);
    return includeReviewRequired ? cases.slice() : cases.filter((item) => item.status !== "REVIEW_REQUIRED");
  }

  async function mergeProfession(profession, options = {}) {
    const target = options.target || (window.SERUMS_DATA && window.SERUMS_DATA.cases);
    if (!Array.isArray(target)) throw new Error("No hay colección de casos operativa para integrar.");
    const incoming = await loadProfession(profession, options);
    const existingIds = new Set(target.map((item) => String(item.id || item.canonical_id || "")));
    const added = incoming.filter((item) => item.id && !existingIds.has(String(item.id)));
    target.push(...added);
    return { profession, loaded: incoming.length, added: added.length, skipped: incoming.length - added.length };
  }


  // Refresh every complete eligible source record, not a hardcoded import batch.
  async function syncImportedCases(options = {}) {
    const target = window.SERUMS_DATA && window.SERUMS_DATA.cases;
    if (!Array.isArray(target)) throw new Error("El banco local aún no está disponible.");
    const incoming = (await remoteRows(options.force === true)).map(normalizeRemote);
    reconcile(target, incoming);
    loadedProfessions.clear();
    for (const item of incoming) loadedProfessions.add(item.career);
    if (typeof renderDashboard === "function" && document.querySelector("#view-root .grid.metrics")) renderDashboard();
    window.dispatchEvent(new CustomEvent("serums:bank-updated", { detail: { loaded: incoming.length } }));
    return incoming.length;
  }

  function refreshBank() {
    return syncImportedCases().catch(error => {
      console.error("Sincronización del banco:", error);
      window.dispatchEvent(new CustomEvent("serums:bank-error", { detail: { message: error.message } }));
      const subtitle = document.getElementById("page-subtitle");
      if (subtitle && !subtitle.textContent.includes("No se pudo sincronizar"))
        subtitle.textContent += " No se pudo sincronizar el banco; se conserva la última carga.";
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refreshBank, { once: true });
  else refreshBank();
  window.addEventListener("focus", refreshBank);
  window.addEventListener("online", refreshBank);
  setInterval(() => { if (document.visibilityState === "visible") refreshBank(); }, CACHE_MS);

  window.SERUMS_BANK = Object.freeze({
    syncImportedCases,
    isUsable,
    listProfessions,
    loadProfession,
    mergeProfession,
    normalize,
    listRemoteProfessions,
    loadRemoteProfession,
    mergeRemoteProfession,
    isRemoteProfessionLoaded
  });
})();



