/* SERUM-APP · Screening integrado */
function renderScreeningTools() {
  pageTitle.textContent = "Screening y Evaluación Clínica";
  pageSubtitle.textContent = "Instrumentos clínicos organizados por área de aplicación.";
  root.innerHTML = `
    <section>
      <div class="panel" style="max-width:900px">
        <h3 class="section-title">Herramientas clínicas</h3>
        <p style="color:#5B6E6A;line-height:1.6">
          Salud mental · Alcohol y otras sustancias · Infancia y neurodesarrollo · TDAH · Violencia · Nutrición clínica
        </p>
        <button id="open-local-screening" class="action-btn" style="margin-top:12px">
          Ver instrumentos →
        </button>
      </div>
    </section>`;
  document.getElementById("open-local-screening").addEventListener("click", () => {
    window.location.href = "screening/screening-index.html";
  });
}
function renderCapacitacionScreening() {
  pageTitle.textContent = "Capacitación · Screening";
  pageSubtitle.textContent = "Formación y aplicación clínica en espacios diferenciados.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Capacitación AUDIT</h3>
        <p style="color:#5B6E6A;line-height:1.6">Administración, interpretación e intervención vinculada al AUDIT.</p>
        <button id="open-audit-training" class="action-btn" style="margin-top:12px">Abrir capacitación AUDIT →</button>
      </div>
      <div class="panel">
        <h3 class="section-title">Aplicación clínica</h3>
        <p style="color:#5B6E6A;line-height:1.6">Acceso al conjunto de instrumentos clínicos integrados.</p>
        <button id="open-screening-panel" class="action-btn" style="margin-top:12px">Ir a Screening →</button>
      </div>
    </section>`;
  document.getElementById("open-audit-training").addEventListener("click", () => { window.location.href = "capacitacion.html"; });
  document.getElementById("open-screening-panel").addEventListener("click", () => { window.location.href = "screening/screening-index.html"; });
}
