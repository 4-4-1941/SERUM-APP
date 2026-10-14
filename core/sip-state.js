const CORE_MODULE_BASE = new URL("./", document.currentScript.src);
const CORE_VIEWS = Object.freeze({cases:"view-cases",simulacro:"view-simulacro",glossary:"view-reference",norms:"view-reference",priorityNorms:"view-reference",decrees:"view-reference",resources:"view-reference",examRegistry:"view-reference",assistant:"view-assistant",oficios:"view-assistant",hisCodesChild:"view-assistant",training:"view-training",review:"view-review",notes:"view-notes"});
const corePending = new Map();
const coreLoaded = new Set();
let coreNavigationRequest = 0;
const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const scoreBadge = document.getElementById("score-badge");
const resolvedBadge = document.getElementById("resolved-badge");
const data = window.SERUMS_DATA;
let score = Number(localStorage.getItem(data.scoreKey) || 0);
let caseState = loadProgress(data.caseStateKey, {});
let notes = localStorage.getItem(data.notesKey) || "";
let timerId = null;
let timeLeft = 60;
let activeCase = null;
let currentList = [];
let selectedOption = null;
let confirmed = false;
let priorityReviewMode = false;
const OFFICIAL_BLOCKS = ["Salud pública", "Cuidado integral", "Ética e interculturalidad", "Investigación", "Gestión"];
const SIMULACRO_TARGET = 100;
const SIMULACRO_SECONDS_PER_Q = 60;
const REAL_EXAM_BLOCK_WEIGHTS = {
  "Gestión": 0.26,
  "Salud pública": 0.26,
  "Ética e interculturalidad": 0.16,
  "Cuidado integral": 0.18,
  "Investigación": 0.14
};
let simulacroQueue = [];
let simulacroIndex = 0;
let simulacroResults = [];
let simulacroSelected = null;
let simulacroConfirmed = false;
let simulacroTimerId = null;
let simulacroTimeLeft = 0;
let simulacroPhase = "intro";
let simulacroHistory = loadProgress("simulacroHistory", []);
let simulacroCareer = localStorage.getItem("simulacroCareer") || "";
const MAX_ATTEMPTS_BEFORE_REVEAL = 2;
let assistantPracticeState = loadProgress("assistantPracticeState", {});
let trainingState = loadProgress("trainingState", {});
let activeTrainingScenario = null;
let activeTrainingStepId = null;

// Registro único de preguntas ya practicadas (Entrenamiento por casos + Simulacro + Repasar hoy).
// Devuelve Map(id como texto -> fecha del último intento en ms; 0 si no se conoce).
function seenQuestionMap() {
  const m = new Map();
  const mark = (id, t) => {
    if (id == null) return;
    const k = String(id);
    const v = Number.isNaN(t) ? 0 : t;
    if (!m.has(k) || m.get(k) < v) m.set(k, v);
  };
  Object.entries(caseState || {}).forEach(([id, st]) => {
    if (!st) return;
    const h = st.history || [];
    h.forEach(x => mark(id, Date.parse(x.date)));
    if (!h.length && st.attempts > 0) mark(id, Date.parse(st.lastAttemptDate));
  });
  (simulacroHistory || []).forEach(r => {
    const t = Date.parse(r && r.date);
    ((r && r.answers) || []).forEach(a => { if (a && !a.unanswered && a.selected != null) mark(a.caseId, t); });
  });
  return m;
}

// Mis notas: lista de dudas/recordatorios {id, text, done, created, doneAt}. Guardada en la clave "myNotesList".
// Si la lista aún no existe, la nota antigua de "Notas rápidas" (texto libre) pasa a ser la primera nota.
function myNotesId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function myNotesLoad() {
  let list = loadProgress("myNotesList", null);
  if (!Array.isArray(list)) {
    list = [];
    if (typeof notes === "string" && notes.trim()) list.push({ id: myNotesId(), text: notes.trim(), done: false, created: new Date().toISOString(), doneAt: null });
    saveProgress("myNotesList", list);
  }
  return list;
}
