function goToSimulacro() {
  priorityReviewMode = false;
  renderView("simulacro");
}

function goToReview() {
  priorityReviewMode = true;
  renderView("cases");
}

function renderDashboard() {
  pageTitle.textContent = "Tablero SERUMS";
  pageSubtitle.textContent = "Casos, normativa y progreso en una sola vista.";

  const careers = [...new Set(data.cases.map(c => c.career || c.specialty))];
  const byCareer = careers.map(career => {
    const casesOfCareer = data.cases.filter(c => (c.career || c.specialty) === career);
    const resolved = casesOfCareer.filter(c => (caseState[c.id] || {}).correct).length;
    return { career, total: casesOfCareer.length, resolved };
  });

  const byBlock = data.chips.map(block => {
    const casesOfBlock = data.cases.filter(c => c.block === block);
    const resolved = casesOfBlock.filter(c => (caseState[c.id] || {}).correct).length;
    return { block, total: casesOfBlock.length, resolved };
  }).filter(b => b.total > 0);

  root.innerHTML = `
    <section class="grid metrics">
      <div class="card"><span class="label">Puntaje</span><div class="value">${score}</div></div>
      <div class="card"><span class="label">Casos</span><div class="value">${data.cases.length}</div></div>
      <div class="card"><span class="label">Normas</span><div class="value">${data.norms.length}</div></div>
      <div class="card"><span class="label">Normas prioritarias 2026</span><div class="value">${data.priorityNorms2026.length}</div></div>
      <div class="card"><span class="label">Decretos</span><div class="value">${data.decrees.length}</div></div>
    </section>
    <section style="margin-bottom:16px">
      <button id="review-btn" class="action-btn">Repasar ahora →</button>
      <span style="margin-left:10px;color:#5B6E6A;font-size:13px">Prioriza casos nunca intentados y con error, empezando por los más antiguos.</span>
    </section>
    <section style="margin-bottom:16px">
      <button id="exam-registry-btn" class="toggle">📚 Base de Datos SERUMS — exámenes reales analizados</button>
    </section>
    <section style="margin-bottom:16px">
      <a class="toggle" href="https://4-4-1941.github.io/PLAZAS-SERUMS-PERU/">🧭 Adjudicación de plazas SERUMS →</a>
      <span style="margin-left:10px;color:#5B6E6A;font-size:13px">Explora, compara y organiza tus alternativas antes de la adjudicación oficial.</span>
    </section>
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Progreso por carrera</h3>
        <div class="progress-list">
          ${byCareer.map(bc => {
            const pct = bc.total ? fmtPct(Math.round((bc.resolved / bc.total) * 100)) : 0;
            return `
              <div>
                <div class="progress-head"><span>${bc.career}</span><span>${bc.resolved}/${bc.total} · ${pct}%</span></div>
                <div class="bar"><span style="width:${pct}%"></span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <div class="panel">
        <h3 class="section-title">Progreso por bloque temático</h3>
        <div class="progress-list">
          ${byBlock.map(bb => {
            const pct = bb.total ? fmtPct(Math.round((bb.resolved / bb.total) * 100)) : 0;
            return `
              <div>
                <div class="progress-head"><span>${bb.block}</span><span>${bb.resolved}/${bb.total} · ${pct}%</span></div>
                <div class="bar"><span style="width:${pct}%"></span></div>
              </div>
            `;
          }).join("")}
        </div>
        <p style="margin-top:14px;color:#5B6E6A;line-height:1.5">Bloques temáticos oficiales SERUMS, con prioridad en Psicología e integración interdisciplinaria de las demás carreras de la salud.</p>
      </div>
    </section>
  `;
  document.getElementById("review-btn").addEventListener("click", goToReview);
  document.getElementById("exam-registry-btn").addEventListener("click", () => renderView("examRegistry"));
}
