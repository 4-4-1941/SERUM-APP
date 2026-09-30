function setActive(view) {
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
}

function updateBadges() {
  scoreBadge.textContent = String(score);
  resolvedBadge.textContent = String(Object.values(caseState).filter(x => x.correct).length);
}

function fmtPct(n) {
  return Math.max(0, Math.min(100, n));
}

function sourceStatusBadge(doc) {
  if (doc.sourceStatus === "criterio_tecnico") {
    return `<div class="badge" style="background:#F4E3B2;color:#6B4E00;border:1px solid #D8B94A">⚠ Criterio técnico — pendiente de validación</div>`;
  }
  return `<div class="badge" style="background:#DCEEE4;color:#1F5C3D;border:1px solid #9FCBB0">✓ Formato oficial MINSA</div>`;
}

function bindToggles() {
  root.querySelectorAll(".toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.target).classList.toggle("open");
    });
  });
}
