/* SERUM-APP · Screening integrado */
function renderScreeningTools() {
  // Evita una pantalla de espera: abre el catálogo visual de inmediato.
  window.location.href = "screening/screening-index.html";
}
function renderCapacitacionScreening() {
  pageTitle.textContent = "Capacitación Continua";
  pageSubtitle.textContent = "Cursos clínicos y sanitarios para el trabajo SERUMS.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <h3 class="section-title">Catálogo de capacitación</h3>
        <p style="color:#5B6E6A;line-height:1.6">AUDIT y cursos de tamizajes integrados en una arquitectura preparada para nuevas líneas SERUMS.</p>
        <button id="open-audit-training" class="action-btn" style="margin-top:12px">Abrir Capacitación Continua →</button>
      </div>
      <div class="panel">
        <h3 class="section-title">Aplicación clínica</h3>
        <p style="color:#5B6E6A;line-height:1.6">Acceso al conjunto de instrumentos clínicos integrados.</p>
        <button id="open-screening-panel" class="action-btn" style="margin-top:12px">Ir a Screening →</button>
      </div>
    </section>`;
  document.getElementById("open-audit-training").addEventListener("click", () => { window.location.href = "capacitacion/index.html"; });
  document.getElementById("open-screening-panel").addEventListener("click", () => { window.location.href = "screening/screening-index.html"; });
}
