(() => {
  "use strict";

  const MODULE_URL = "https://4-4-1941.github.io/PLAZAS-SERUMS-PERU/";

  function mountAdjudicacionLauncher() {
    const nav = document.querySelector(".sidebar .nav");
    if (!nav || nav.querySelector("[data-module='adjudicacion']")) return;

    const section = document.createElement("div");
    section.className = "nav-section-label";
    section.textContent = "ADJUDICACIÓN";

    const link = document.createElement("a");
    link.className = "nav-btn";
    link.dataset.module = "adjudicacion";
    link.href = MODULE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Plazas y adjudicación";
    link.setAttribute("aria-label", "Abrir módulo de plazas y adjudicación SERUMS");
    link.style.display = "flex";
    link.style.alignItems = "center";
    link.style.width = "100%";
    link.style.textDecoration = "none";

    nav.append(section, link);
  }

  window.SERUMS_ADJUDICACION = Object.freeze({ url: MODULE_URL });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAdjudicacionLauncher, { once: true });
  } else {
    mountAdjudicacionLauncher();
  }
})();
