const CORE_CATALOGS = Object.freeze({'view-reference':'sip-data-reference','view-assistant':'sip-data-assistant','view-training':'sip-data-training'});
const coreScripts = new Map();
function loadCoreScript(name) {
  if (coreScripts.has(name)) return coreScripts.get(name);
  const pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(name + '.js?v=20261010-oficios', CORE_MODULE_BASE).href;
    script.onload = resolve;
    script.onerror = () => { script.remove(); coreScripts.delete(name); reject(new Error('Carga fallida: ' + name)); };
    document.head.appendChild(script);
  });
  coreScripts.set(name, pending);
  return pending;
}
function loadCoreView(name) {
  if (coreLoaded.has(name)) return Promise.resolve();
  if (corePending.has(name)) return corePending.get(name);
  const catalogue = CORE_CATALOGS[name];
  const pending = (catalogue ? loadCoreScript(catalogue) : Promise.resolve())
    .then(() => loadCoreScript(name))
    .then(() => { coreLoaded.add(name); corePending.delete(name); })
    .catch(error => { corePending.delete(name); throw error; });
  corePending.set(name, pending);
  return pending;
}


async function renderView(view) {
  const request = ++coreNavigationRequest;
  const moduleName = CORE_VIEWS[view];
  if (moduleName && !coreLoaded.has(moduleName)) {
    clearInterval(timerId); timerId = null;
    clearInterval(simulacroTimerId); simulacroTimerId = null;
    try { await loadCoreView(moduleName); }
    catch (error) {
      if (request !== coreNavigationRequest) return;
      console.error("No se pudo cargar la sección:", error);
      const previous = document.getElementById("core-load-error");
      if (previous) previous.remove();
      const message = document.createElement("div");
      message.id = "core-load-error";
      message.setAttribute("role", "alert");
      message.textContent = "No se pudo abrir la sección. Se conserva la vista anterior. ";
      const retry = document.createElement("button");
      retry.type = "button"; retry.textContent = "Reintentar";
      retry.addEventListener("click", () => renderView(view));
      message.appendChild(retry); root.prepend(message);
      return;
    }
    if (request !== coreNavigationRequest) return;
  }

  clearInterval(timerId);
  timerId = null;
  activeCase = null;
  if (view !== "simulacro") {
    clearInterval(simulacroTimerId);
    simulacroTimerId = null;
  }
  if (view === "dashboard") renderDashboard();
  if (view === "cases") renderCases();
  if (view === "simulacro") renderSimulacro();
  if (view === "glossary") renderGlossary();
  if (view === "norms") renderNorms();
  if (view === "priorityNorms") renderPriorityNorms();
  if (view === "assistant") renderAssistant("formatos");
  if (view === "oficios") renderAssistant("oficios");
  if (view === "hisCodesChild") renderHisCodesChild();
  if (view === "training") renderTraining();
  if (view === "decrees") renderDecrees();
  if (view === "resources") renderResources();
  if (view === "examRegistry") renderExamRegistry();
  if (view === "screeningTools") renderScreeningTools();
  if (view === "screening") renderCapacitacionScreening();
  setActive(view);
  updateBadges();
  if (window.__sipBooted) scrollToViewTop();
}

// En celular el menú ocupa la parte de arriba: baja al contenido de la sección.
function scrollToViewTop() {
  if (!window.matchMedia("(max-width: 1024px)").matches) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const top = document.getElementById("view-root");
    if (top) top.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}
