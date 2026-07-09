const cases = [
  {
    id: 1,
    title: "Caso 1",
    question: "¿Qué pasa con este paciente?",
    options: ["Respuesta A", "Respuesta B", "Respuesta C"],
    answer: 1,
    explanation: "Explicación corta del caso 1."
  },
  {
    id: 2,
    title: "Caso 2",
    question: "¿Cuál es la respuesta correcta?",
    options: ["Opción A", "Opción B", "Opción C"],
    answer: 0,
    explanation: "Explicación corta del caso 2."
  }
];

const state = {
  completed: Number(localStorage.getItem("preSerumCompleted") || 0),
  correct: Number(localStorage.getItem("preSerumCorrect") || 0)
};

function saveState() {
  localStorage.setItem("preSerumCompleted", String(state.completed));
  localStorage.setItem("preSerumCorrect", String(state.correct));
}

function updateStats(ok) {
  state.completed += 1;
  if (ok) state.correct += 1;
  saveState();
}

function getAccuracy() {
  return state.completed ? Math.round((state.correct / state.completed) * 100) : 0;
}

function renderStatsCard() {
  return `
    <div class="panel">
      <h3>Estado general</h3>
      <p>Casos resueltos: <strong>${state.completed}</strong></p>
      <p>Respuestas correctas: <strong>${state.correct}</strong></p>
      <p>Precisión: <strong>${getAccuracy()}%</strong></p>
    </div>
  `;
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function renderCases() {
  const items = cases.map((c, index) => `
    <div class="case-card">
      <h3>${safeText(c.title, `Caso ${index + 1}`)}</h3>
      <p>${safeText(c.question, "Sin pregunta")}</p>
      <div class="options">
        ${c.options.map((opt, i) => `
          <button onclick="answerCase(${c.id}, ${i})">${opt}</button>
        `).join("")}
      </div>
    </div>
  `).join("");

  const container = document.getElementById("app");
  if (container) {
    container.innerHTML = renderStatsCard() + items;
  }
}

function answerCase(caseId, selectedIndex) {
  const c = cases.find(x => x.id === caseId);
  if (!c) return;

  const ok = selectedIndex === c.answer;
  updateStats(ok);

  alert(ok ? "Correcto" : `Incorrecto. ${c.explanation}`);
  renderCases();
}

document.addEventListener("DOMContentLoaded", renderCases);
