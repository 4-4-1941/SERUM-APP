function renderTraining() {
  pageTitle.textContent = "Entrenamiento SERUMS";
  pageSubtitle.textContent = "Escenarios, quizzes y simuladores para practicar decisiones clínicas y procesos de referencia.";
  const modules = [
    { name: "Quiz avanzado de referencia", badge: "15 preguntas · Referencia", desc: "Practica criterios de referencia y contrarreferencia.", url: "simulador/quiz-avanzado-referencia.html" },
    { name: "Quiz etapa niño", badge: "Evaluación pediátrica", desc: "Repaso dirigido a la atención integral de niñas y niños.", url: "simulador/quiz-etapa-nino.html" },
    { name: "Simulador de referencia y contrarreferencia", badge: "Práctica guiada", desc: "Entrena la toma de decisiones y el flujo de derivación.", url: "simulador/simulador-referencia-contrarreferencia.html" },
    { name: "Simulador de referencia clínica", badge: "Caso clínico", desc: "Ejercita el proceso de referencia en un escenario clínico.", url: "simulador/simulador-referencia.html" }
  ];
  root.innerHTML =     `<section class="panel" style="margin-bottom:16px">
      <h3 class="section-title">Quizzes y simuladores</h3>
      <div class="norm-list">
        ${modules.map(m =>           `<article class="norm-card">
            <span>${m.badge}</span>
            <h3>${m.name}</h3>
            <p>${m.desc}</p>
            <button class="action-btn" data-training-url="${m.url}" style="margin-top:10px">Abrir módulo →</button>
          </article>`
        ).join("")}
      </div>
    </section>
    <section>
      <h3 class="section-title">Escenarios de campo</h3>
      <div id="training-list" class="norm-list"></div>
    </section>`;
  const list = document.getElementById("training-list");
  list.innerHTML = data.trainingScenarios.map(sc => {
    const st = trainingState[sc.id];
    const badge = st && st.completed
      ? `<span class="badge">Completado</span>`
      : st ? `<span class="badge" style="background:#FCEBEA;color:#8A2A24">En progreso</span>`
      : `<span class="badge">Nuevo</span>`;
    return       `<article class="norm-card">
        <span>${sc.skillsEvaluated.join(" · ")}</span>
        <h3>${sc.title}</h3>
        <p>${sc.context}</p>
        ${badge}
        <button class="action-btn" data-scenario="${sc.id}" style="margin-top:10px">${st ? "Continuar escenario →" : "Iniciar escenario →"}</button>
      </article>`;
  }).join("");

  root.querySelectorAll("[data-training-url]").forEach(btn => {
    btn.addEventListener("click", () => window.location.href = btn.dataset.trainingUrl);
  });
  list.querySelectorAll("[data-scenario]").forEach(btn => {
    btn.addEventListener("click", () => startTrainingScenario(btn.dataset.scenario));
  });
}

function startTrainingScenario(scenarioId) {
  activeTrainingScenario = data.trainingScenarios.find(s => s.id === scenarioId);
  if (!activeTrainingScenario) return;
  const st = trainingState[scenarioId];
  activeTrainingStepId = (st && !st.completed) ? st.currentStepId : activeTrainingScenario.startStep;
  renderTrainingStep();
}

function renderTrainingStep() {
  const sc = activeTrainingScenario;
  pageTitle.textContent = sc.title;
  pageSubtitle.textContent = "Escenario de Entrenamiento SERUMS";

  if (activeTrainingStepId === "end") {
    trainingState[sc.id] = { completed: true, currentStepId: "end" };
    saveProgress("trainingState", trainingState);
    root.innerHTML = `
      <button id="back-to-training-btn" class="toggle" style="margin-bottom:12px;margin-top:0">← Volver a Entrenamiento SERUMS</button>
      <div class="panel">
        <h3 class="section-title">Escenario completado</h3>
        <p style="color:#5B6E6A">Competencias entrenadas en este escenario:</p>
        <ul style="margin:6px 0 12px 18px;color:#5B6E6A">${sc.skillsEvaluated.map(s => `<li>${s}</li>`).join("")}</ul>
        <button class="action-btn" id="restart-scenario-btn">Reiniciar escenario</button>
      </div>
    `;
    document.getElementById("back-to-training-btn").addEventListener("click", renderTraining);
    document.getElementById("restart-scenario-btn").addEventListener("click", () => {
      activeTrainingStepId = sc.startStep;
      trainingState[sc.id] = { completed: false, currentStepId: sc.startStep };
      saveProgress("trainingState", trainingState);
      renderTrainingStep();
    });
    return;
  }

  const step = sc.steps.find(s => s.id === activeTrainingStepId);
  trainingState[sc.id] = { completed: false, currentStepId: step.id };
  saveProgress("trainingState", trainingState);

  root.innerHTML = `
    <button id="back-to-training-btn" class="toggle" style="margin-bottom:12px;margin-top:0">← Volver a Entrenamiento SERUMS</button>
    <div class="badge">${sc.title}</div>
    <h3 class="section-title">${step.title}</h3>
    <p>${step.prompt}</p>
    <div class="option-list" id="training-options">
      ${step.options.map((o, i) => `<button class="option-btn" data-opt="${i}">${o.text}</button>`).join("")}
    </div>
    <div id="training-feedback" style="margin-top:12px"></div>
    <div id="training-actions" style="margin-top:12px"></div>
  `;

  document.getElementById("back-to-training-btn").addEventListener("click", renderTraining);

  document.querySelectorAll("#training-options .option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const opt = step.options[Number(btn.dataset.opt)];
      document.querySelectorAll("#training-options .option-btn").forEach(b => b.disabled = true);
      btn.classList.add(opt.correct ? "success" : "error");
      document.getElementById("training-feedback").innerHTML = `
        <div class="card ${opt.correct ? "success" : "error"}">
          <strong>${opt.correct ? "Buena decisión" : "Decisión con consecuencias"}</strong>
          <p>${opt.feedback}</p>
        </div>
      `;
      document.getElementById("training-actions").innerHTML = `<button class="action-btn" id="next-step-btn">Continuar →</button>`;
      document.getElementById("next-step-btn").addEventListener("click", () => {
        activeTrainingStepId = opt.next;
        renderTrainingStep();
      });
    });
  });
}
