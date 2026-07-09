const state = {
  current: 0,
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
    <div class="stats">
      <div class="stat">
        <span class="label">Casos resueltos</span>
        <span class="value">${state.completed}</span>
      </div>
      <div class="stat">
        <span class="label">Correctas</span>
        <span class="value">${state.correct}</span>
      </div>
      <div class="stat">
        <span class="label">Precisión</span>
        <span class="value">${getAccuracy()}%</span>
      </div>
    </div>
    <div class="footer-note">Tu progreso se guarda en este navegador.</div>
  `;
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function renderCase(c) {
  return `
    <div class="case-card">
      <h2>${safeText(c.title, "Caso")}</h2>
      <p>${safeText(c.question, "Sin pregunta")}</p>
      <div class="options">
        ${c.options.map((opt, i) => `
          <button class="option-btn" id="opt-${i}" onclick="answerCase(${c.id}, ${i})">${opt}</button>
        `).join("")}
      </div>
      <div id="feedback" class="feedback"></div>
    </div>
  `;
}

function renderApp() {
  const c = cases[state.current];
  document.getElementById("app").innerHTML = renderStatsCard() + `<div class="cases-grid">${renderCase(c)}</div>`;
}

function answerCase(caseId, selectedIndex) {
  const c = cases.find(x => x.id === caseId);
  if (!c) return;

  const ok = selectedIndex === c.answer;
  updateStats(ok);

  const buttons = Array.from(document.querySelectorAll(".option-btn"));
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === c.answer) btn.classList.add("correct");
    if (idx === selectedIndex && !ok) btn.classList.add("incorrect");
  });

  const feedback = document.getElementById("feedback");
  feedback.style.display = "block";
  feedback.textContent = ok ? "Correcto. " + c.explanation : "Incorrecto. " + c.explanation;

  setTimeout(renderApp, 900);
}

document.addEventListener("DOMContentLoaded", renderApp);
