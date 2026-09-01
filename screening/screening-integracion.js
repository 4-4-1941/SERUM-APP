/* SERUM-APP · integración de Screening */
function renderScreeningTools() {
  pageTitle.textContent = "Screening Clínico";
  pageSubtitle.textContent = "Instrumentos de tamizaje para la práctica profesional.";
  root.innerHTML = `
    <section>
      <div class="panel" style="max-width:760px">
        <h3 class="section-title">Instrumentos de tamizaje</h3>
        <p style="color:#5B6E6A;line-height:1.6">
          Acceda a los instrumentos clínicos disponibles en SERUM-APP.
        </p>
        <button id="open-local-screening" class="action-btn" style="margin-top:12px">
          Abrir Screening Clínico →
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
        <p style="color:#5B6E6A;line-height:1.6">
          Contenidos formativos para administración e interpretación del AUDIT.
        </p>
        <button id="open-audit-training" class="action-btn" style="margin-top:12px">
          Abrir capacitación AUDIT →
        </button>
      </div>
      <div class="panel">
        <h3 class="section-title">AUDIT clínico</h3>
        <p style="color:#5B6E6A;line-height:1.6">
          Aplicación del cuestionario AUDIT dentro del módulo de tamizaje clínico.
        </p>
        <button id="open-audit-test" class="action-btn" style="margin-top:12px">
          Abrir AUDIT →
        </button>
      </div>
    </section>`;
  document.getElementById("open-audit-training").addEventListener("click", () => {
    window.location.href = "capacitacion.html";
  });
  document.getElementById("open-audit-test").addEventListener("click", () => {
    window.location.href = "screening/audit.html";
  });
}
