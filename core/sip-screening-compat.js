function renderScreeningTools() {
  pageTitle.textContent = "Clinical Screening Toolkit";
  pageSubtitle.textContent = "Instrumentos de tamizaje clínico validados, con registro automático del caso para investigación epidemiológica.";
  const tools = [
    {
      name: "AUDIT / AUDIT-C",
      badge: "10 ítems · OMS 2001",
      desc: "Identificación de Trastornos por Consumo de Alcohol. Incluye modo de tamizaje rápido AUDIT-C (3 preguntas, con opción de continuar al AUDIT completo si sale positivo). Disponible en español y quechua ayacuchano validado (Douglas Hospital Research Centre / IPAZ).",
      url: "capacitacion/index.html"
    },
    {
      name: "GAD-7",
      badge: "7 ítems · Spitzer et al., 2006",
      desc: "Escala de Ansiedad Generalizada. Versión en castellano.",
      url: "screening/gad7.html"
    },
    {
      name: "PHQ-9",
      badge: "9 ítems · Kroenke, Spitzer & Williams, 2001",
      desc: "Cuestionario de Salud del Paciente para depresión. Corte de cribado preventivo MINSA ≥5 (además del corte internacional ≥10). Incluye alerta clínica en el ítem de ideación suicida/autolesión.",
      url: "screening/phq9.html"
    },
    {
      name: "WAST",
      badge: "2 ítems · Brown et al., 1996",
      desc: "Tamizaje corto de violencia de pareja hacia la mujer (Woman Abuse Screening Tool). Versión validada en español (Plazaola-Castaño et al., 2008).",
      url: "screening/wast.html"
    },
    {
      name: "ASSIST",
      badge: "10 sustancias · OMS v3.0",
      desc: "Tamizaje de consumo de alcohol y drogas por sustancia (alcohol, tabaco, marihuana, cocaína y otras). Cortes oficiales OMS 2011, con alerta adicional para adolescentes (RM N.° 753-2021-MINSA).",
      url: "screening/assist.html"
    },
    {
      name: "CRAFFT",
      badge: "6 ítems · Knight, 1999 · v2.1",
      desc: "Tamizaje breve de consumo de alcohol y drogas en adolescentes y jóvenes (10-21 años). Corte oficial: 2 o más respuestas afirmativas = riesgo alto. © Boston Children's Hospital.",
      url: "screening/crafft.html"
    },
    {
      name: "TDAH",
      badge: "ASRS-v1.1 · Vanderbilt · SNAP-IV",
      desc: "Tamizaje de TDAH en adultos (ASRS-v1.1, OMS) y niños (Vanderbilt Padres o SNAP-IV 26, a elegir al ingresar).",
      url: "screening/tdah.html"
    },
    {
      name: "Nutrición",
      badge: "Calculadora clínica",
      desc: "IMC, peso ideal (Devine/Robinson/Miller/Hamwi) y gasto energético (Harris-Benedict/Mifflin-St Jeor). Herramienta de apoyo para el profesional.",
      url: "screening/nutricion.html"
    },
    {
      name: "SRQ-18",
      badge: "18 ítems · Screening de Salud General",
      desc: "Cuestionario de autorreporte para detección de síntomas ansioso-depresivos en población general. Punto de corte: ≥8 = positivo.",
      url: "screening/srq18.html"
    },
    {
      name: "PSC Pediátrico",
      badge: "30 ítems · Lista de Síntomas Pediátricos",
      desc: "Cribado de disfunción psicosocial infantil (4-16 años), completado por padres/cuidadores. Detecta problemas emocionales, conductuales y sociales.",
      url: "screening/psc-pediatrico.html"
    },
    {
      name: "M-CHAT-R/F",
      badge: "20 ítems · Detección de Riesgo TEA",
      desc: "Cribado de riesgo de Trastorno del Espectro Autista en lactantes 16-30 meses. Puntos de corte: 0-2 (bajo), 3-7 (medio), 8+ (alto/derivación urgente).",
      url: "screening/mchat-rf.html"
    },
    {
      name: "GDS-15",
      badge: "15 ítems · Escala de Depresión Geriátrica (Yesavage)",
      desc: "Escala validada para detección de depresión en adultos ≥65 años. Sensible a cambios clínicos. Puntos de corte: 0-4 (sin), 5-8 (leve), 9-15 (moderada-severa).",
      url: "screening/gds15-yesavage.html"
    },
    {
      name: "PCL-5",
      badge: "20 ítems · Weathers et al., 2013 · DSM-5",
      desc: "Tamizaje de síntomas de TEPT en el último mes. Puntaje 0-80, corte operativo ≥33 y mínimos por clúster (B, C, D, E). No sustituye la evaluación clínica.",
      url: "screening/pcl5.html"
    },
    {
      name: "Quiz SERUMS",
      badge: "10 preguntas · Banco interno",
      desc: "Quiz interactivo que usa preguntas del banco interno de la plataforma, con retroalimentación al finalizar.",
      url: "screening/quiz-serums.html"
    }
  ];
  root.innerHTML = `
    <div class="norm-list">
      ${tools.map(t => `
        <article class="norm-card">
          <span>${t.badge}</span>
          <h3>${t.name}</h3>
          <p>${t.desc}</p>
          <button class="action-btn" data-url="${t.url}" style="margin-top:10px">Abrir ${t.name} →</button>
        </article>
      `).join("")}
    </div>
    <p style="margin-top:16px;color:#5B6E6A;font-size:13px">Cada aplicación queda registrada con datos demográficos anonimizados (sexo, edad, estado civil, departamento) en la base de datos SERUMS.</p>
  `;
  root.querySelectorAll("[data-url]").forEach(btn => {
    btn.addEventListener("click", () => window.open(btn.dataset.url, "_blank"));
  });
}

function renderCapacitacionScreening() {
  pageTitle.textContent = "Capacitación · Screening";
  pageSubtitle.textContent = "Módulos de tamizaje clínico validados para formación de SERUMS.";
  const tools = [
    { name: "AUDIT / AUDIT-C", badge: "10 ítems · OMS 2001", desc: "Identificación de Trastornos por Consumo de Alcohol. Incluye modo de tamizaje rápido AUDIT-C (3 preguntas, con opción de continuar al AUDIT completo si sale positivo).", url: "capacitacion/index.html" },
    { name: "GAD-7", badge: "7 ítems · Spitzer et al., 2006", desc: "Escala de Ansiedad Generalizada. Versión en castellano.", url: "screening/gad7.html" },
    { name: "PHQ-9", badge: "9 ítems · Kroenke, Spitzer & Williams, 2001", desc: "Cuestionario de Salud del Paciente para depresión.", url: "screening/phq9.html" },
    { name: "WAST", badge: "2 ítems · Brown et al., 1996", desc: "Tamizaje corto de violencia de pareja hacia la mujer.", url: "screening/wast.html" },
    { name: "ASSIST", badge: "10 sustancias · OMS v3.0", desc: "Tamizaje de consumo de alcohol y drogas por sustancia.", url: "screening/assist.html" },
    { name: "CRAFFT", badge: "6 ítems · Knight, 1999 · v2.1", desc: "Tamizaje breve de consumo de alcohol y drogas en adolescentes y jóvenes.", url: "screening/crafft.html" },
    { name: "TDAH", badge: "ASRS-v1.1 · Vanderbilt · SNAP-IV", desc: "Tamizaje de TDAH en adultos, niños y adolescentes.", url: "screening/tdah.html" },
    { name: "Nutrición", badge: "Calculadora clínica", desc: "IMC, peso ideal estimado y gasto energético.", url: "screening/nutricion.html" },
    { name: "SRQ-18", badge: "18 ítems · Screening de Salud General", desc: "Cuestionario de autorreporte para detección de síntomas ansioso-depresivos en población general. Punto de corte: ≥8 = positivo.", url: "screening/srq18.html" },
    { name: "PSC Pediátrico", badge: "30 ítems · Lista de Síntomas Pediátricos", desc: "Cribado de disfunción psicosocial infantil (4-16 años), completado por padres/cuidadores. Detecta problemas emocionales, conductuales y sociales.", url: "screening/psc-pediatrico.html" },
    { name: "M-CHAT-R/F", badge: "20 ítems · Detección de Riesgo TEA", desc: "Cribado de riesgo de Trastorno del Espectro Autista en lactantes 16-30 meses.", url: "screening/mchat-rf.html" },
    { name: "GDS-15", badge: "15 ítems · Escala de Depresión Geriátrica (Yesavage)", desc: "Escala validada para detección de depresión en adultos ≥65 años. Sensible a cambios clínicos. Puntos de corte: 0-4 (sin), 5-8 (leve), 9-15 (moderada-severa).", url: "screening/gds15-yesavage.html" },
    { name: "PCL-5", badge: "20 ítems · Weathers et al., 2013 · DSM-5", desc: "Tamizaje de síntomas de TEPT en el último mes. Corte operativo ≥33.", url: "screening/pcl5.html" },
    { name: "Quiz SERUMS", badge: "10 preguntas · Banco interno", desc: "Quiz interactivo con preguntas del banco interno de la plataforma.", url: "screening/quiz-serums.html" },
    { name: "Contrarreferencia", badge: "Formato interactivo", desc: "Formato para registrar alta, tratamiento y plan de seguimiento.", url: "capacitacion/recursos/formatos/contrarreferencia.html" },
    { name: "Derivación", badge: "Formato interactivo", desc: "Formato para documentar la derivación o referencia.", url: "capacitacion/recursos/formatos/referencia.html" }
  ];
  root.innerHTML = `
    <div class="norm-list">
      ${tools.map(t => `
        <article class="norm-card">
          <span>${t.badge}</span>
          <h3>${t.name}</h3>
          <p>${t.desc}</p>
          <button class="action-btn" data-url="${t.url}" style="margin-top:10px">Abrir ${t.name} →</button>
        </article>
      `).join("")}
    </div>
    <p style="margin-top:16px;color:#5B6E6A;font-size:13px">Cada aplicación queda registrada con datos demográficos anonimizados en la base de datos SERUMS.</p>
  `;
  root.querySelectorAll("[data-url]").forEach(btn => {
    btn.addEventListener("click", () => window.open(btn.dataset.url, "_blank"));
  });
}
