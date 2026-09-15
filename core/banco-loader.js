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
  const indexPromise = fetch(new URL(INDEX_FILE, BASE_URL), { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo leer el índice del banco (${response.status}).`);
      return response.json();
    });
  const moduleCache = new Map();

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

  async function listProfessions() {
    const index = await indexPromise;
    return asArray(index).map((item) => ({
      profession: item.profession || item.name || item.career,
      file: item.file || item.path,
      count: item.count || item.total_questions || item.questions || item.total || 0
    })).filter((item) => item.profession && item.file);
  }

  async function loadProfession(profession, options = {}) {
    const { includeReviewRequired = false } = options;
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

  window.SERUMS_BANK = Object.freeze({
    listProfessions,
    loadProfession,
    mergeProfession,
    normalize
  });
})();
