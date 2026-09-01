/* SERUM-APP · integración operativa de Screening
   Cargado DESPUÉS de app.js para preservar el núcleo existente y sustituir únicamente
   la navegación clínica que todavía apuntaba fuera de SERUM-APP. */

function renderScreeningTools() {
  pageTitle.textContent = "Clinical Screening";
  pageSubtitle.textContent = "Instrumentos clínicos integrados localmente en SERUM-APP.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Screening clínico</h3>
        <p style="color:#5B6E6A;line-height:1.6">
          Acceso directo al módulo interno. No requiere contraseña ni depende del repositorio externo.
        </p>
        <button id="open-local-screening" class="action-btn" style="margin-top:12px">
          Abrir Screening Clínico →
        </button>
      </div>
      <div class="panel">
        <h3 class="section-title">Privacidad operativa</h3>
        <p style="color:#5B6E6A;line-height:1.6">
          Los instrumentos integrados en este módulo calculan el resultado localmente y no registran
          datos identificatorios del paciente.
        </p>
      </div>
    </section>`;
  document.getElementById("open-local-screening").addEventListener("click", () => {
    window.location.href = "screening/screening-index.html";
  });
}

function renderCapacitacionScreening() {
  pageTitle.textContent = "Capacitación · Screening";
  pageSubtitle.textContent = "Entrenamiento separado de la aplicación clínica de los instrumentos.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Capacitación AUDIT</h3>
        <p style="color:#5B6E6A;line-height:1.6">
          Módulo formativo AUDIT ya contenido en SERUM-APP. No es la prueba clínica.
        </p>
        <button id="open-audit-training" class="action-btn" style="margin-top:12px">
          Abrir capacitación AUDIT →
        </button>
      </div>
      <div class="panel">
        <h3 class="section-title">Prueba clínica AUDIT</h3>
        <p style="color:#5B6E6A;line-height:1.6">
          La aplicación del AUDIT se encuentra en Clinical Screening.
        </p>
        <button id="open-audit-test" class="action-btn" style="margin-top:12px">
          Abrir prueba AUDIT →
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
