const root = document.getElementById("view-root");
const navButtons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

let timerId = null;
let timeLeft = 60;
let score = Number(localStorage.getItem("preSerumScore") || 0);

const interactiveCases = [
  {
    id: 1,
    title: "Riesgo suicida en adolescente",
    level: "I-2",
    specialty: "Psicología",
    tags: ["salud mental", "crisis", "derivación"],
    statement: "Adolescente de 16 años llega al establecimiento I-2 con ideación suicida, aislamiento, antecedente de violencia familiar y soporte limitado.",
    question: "¿Cuál es la conducta más adecuada?",
    options: [
      "Dar consejería breve y citar en una semana.",
      "Intervenir en crisis, estabilizar y derivar urgentemente.",
      "Indicar reposo y observación domiciliaria."
    ],
    correct: 1,
    feedback: "La conducta correcta es intervenir en crisis, estabilizar y derivar con urgencia por riesgo alto."
  },
  {
    id: 2,
    title: "Violencia familiar con ansiedad",
    level: "I-2",
    specialty: "Psicología",
    tags: ["violencia familiar", "ansiedad", "tamizaje"],
    statement: "Mujer adulta consulta por insomnio, ansiedad y dolor somático. Refiere episodios de violencia familiar y temor al regresar a casa.",
    question: "¿Qué acción corresponde primero?",
    options: [
      "Tamizar riesgo, brindar soporte inicial y derivar según norma.",
      "Solo prescribir descanso y control posterior.",
      "Ignorar el antecedente para evitar revictimización."
    ],
    correct: 0,
    feedback: "Primero se debe tamizar, brindar soporte inicial y definir derivación según el nivel de riesgo."
  }
];

function setActive(view) {
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
}

function saveProgress(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadProgress(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
