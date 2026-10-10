const CORE_MODULE_BASE = new URL("./", document.currentScript.src);
const CORE_VIEWS = Object.freeze({cases:"view-cases",simulacro:"view-simulacro",glossary:"view-reference",norms:"view-reference",priorityNorms:"view-reference",decrees:"view-reference",resources:"view-reference",examRegistry:"view-reference",assistant:"view-assistant",oficios:"view-assistant",hisCodesChild:"view-assistant",training:"view-training"});
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
