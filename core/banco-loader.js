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
    const answer = item.declared_answer || item.correct || item.answer;
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
      status: "REVIEW_REQUIRED",
      source: "supabase:SERUM-APP"
    };
  }

  async function listRemoteProfessions() {
    if (!remoteProfessionPromise) {
      remoteProfessionPromise = (async () => {
        const client = remoteClient();
        const careers = [];
        const pageSize = 1000;
        for (let from = 0; ; from += pageSize) {
          const { data, error } = await client
            .from(REMOTE_CONFIG.table)
            .select("career")
            .contains("tags", JSON.stringify([REMOTE_CONFIG.sourceTag]))
            .range(from, from + pageSize - 1);
          if (error) throw new Error(`No se pudo leer el banco remoto: ${error.message}`);
          careers.push(...(data || []).map((row) => row.career).filter(Boolean));
          if (!data || data.length < pageSize) break;
        }
        const counts = careers.reduce((result, career) => {
          result.set(career, (result.get(career) || 0) + 1);
          return result;
        }, new Map());
        return [...counts.entries()]
          .map(([profession, count]) => ({ profession, count }))
          .sort((first, second) => first.profession.localeCompare(second.profession, "es"));
      })().catch((error) => {
        remoteProfessionPromise = null;
        throw error;
      });
    }
    return remoteProfessionPromise;
  }

  async function loadRemoteProfession(profession) {
    if (!profession) throw new Error("Debes indicar una profesión.");
    if (!remoteModuleCache.has(profession)) {
      remoteModuleCache.set(profession, (async () => {
        const client = remoteClient();
        const rows = [];
        const pageSize = 500;
        for (let from = 0; ; from += pageSize) {
          const { data, error } = await client
            .from(REMOTE_CONFIG.table)
            .select("*")
            .eq("career", profession)
            .contains("tags", JSON.stringify([REMOTE_CONFIG.sourceTag]))
            .order("id", { ascending: true })
            .range(from, from + pageSize - 1);
          if (error) throw new Error(`No se pudo cargar ${profession}: ${error.message}`);
          rows.push(...(data || []));
          if (!data || data.length < pageSize) break;
        }
        return rows.map(normalizeRemote).filter((item) => item.options.length === 4 && item.correct >= 0 && item.correct <= 3);
      })().catch((error) => {
        remoteModuleCache.delete(profession);
        throw error;
      }));
    }
    return (await remoteModuleCache.get(profession)).slice();
  }

  async function mergeRemoteProfession(profession, options = {}) {
    const target = options.target || (window.SERUMS_DATA && window.SERUMS_DATA.cases);
    if (!Array.isArray(target)) throw new Error("No hay colección de casos operativa para integrar.");
    const incoming = await loadRemoteProfession(profession);
    const existingIds = new Set(target.map((item) => String(item.id)));
    const added = incoming.filter((item) => !existingIds.has(String(item.id)));
    target.push(...added);
    return { profession, loaded: incoming.length, added: added.length, skipped: incoming.length - added.length };
  }

  function isRemoteProfessionLoaded(profession) {
    return remoteModuleCache.has(profession);
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


  // Incorporar los lotes nuevos al banco operativo inicial, conservando IDs locales.
  async function syncImportedCases() {
    const target = window.SERUMS_DATA && window.SERUMS_DATA.cases;
    if (!Array.isArray(target)) return;
    const client = remoteClient();
    const incoming = [];
    for (let from = 0; ; from += 500) {
      const { data: rows, error } = await client.from(REMOTE_CONFIG.table)
        .select("*").contains("tags", JSON.stringify([REMOTE_CONFIG.sourceTag, "status:REVIEW_REQUIRED"]))
        .order("id", { ascending: true }).range(from, from + 499);
      if (error) throw new Error(error.message);
      for (const row of rows || []) {
        const tags = parseJson(row.tags, []);
        if (!Array.isArray(tags) || !tags.some(tag => String(tag).startsWith("import:TM600:"))) continue;
        if (!Number.isInteger(row.correct) || row.correct < 0 || row.correct > 3) continue;
        const item = normalizeRemote(row);
        if (item.options.length === 4) incoming.push(item);
      }
      if (!rows || rows.length < 500) break;
    }
    const ids = new Set(target.map(item => String(item.id)));
    for (const item of incoming) {
      if (!ids.has(item.id)) { target.push(item); ids.add(item.id); }
    }
    if (typeof renderDashboard === "function" &&
        document.querySelector("#view-root .grid.metrics")) {
      renderDashboard();
    }
    return incoming.length;
  }

  document.addEventListener("DOMContentLoaded", () => {
    syncImportedCases().catch(error => {
      console.error("Sincronización del lote importado:", error);
      const subtitle = document.getElementById("page-subtitle");
      if (subtitle) subtitle.textContent += " No se pudo sincronizar el lote nuevo; recarga para reintentar.";
    });
  });

  window.SERUMS_BANK = Object.freeze({
    syncImportedCases,
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


