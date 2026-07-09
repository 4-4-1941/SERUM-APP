window.SERUMS_DATA = {
  scoreKey: "serumsScore",
  caseStateKey: "serumsCaseState",
  notesKey: "serumsNotes",
  chips: ["salud pública", "cuidado integral", "ética", "gestión", "investigación", "interculturalidad"],
  cases: [
    {
      id: 1,
      block: "Psicología",
      title: "Riesgo suicida en adolescente",
      level: "I-2",
      specialty: "Psicología",
      tags: ["salud mental", "crisis", "derivación"],
      statement: "Adolescente de 16 años llega al establecimiento I-2 con ideación suicida, aislamiento y soporte familiar limitado.",
      question: "¿Cuál es la conducta más adecuada?",
      options: [
        "Dar consejería breve y citar en una semana.",
        "Intervenir en crisis, estabilizar y derivar urgentemente.",
        "Indicar reposo y observación domiciliaria."
      ],
      correct: 1,
      feedback: "La conducta correcta es intervenir en crisis, estabilizar y derivar con urgencia por riesgo alto."
    },
    {
      id: 2,
      block: "Psicología",
      title: "Violencia familiar con ansiedad",
      level: "I-2",
      specialty: "Psicología",
      tags: ["violencia familiar", "ansiedad", "tamizaje"],
      statement: "Mujer adulta consulta por insomnio, ansiedad y dolor somático. Refiere violencia familiar y temor al regresar a casa.",
      question: "¿Qué acción corresponde primero?",
      options: [
        "Tamizar riesgo, brindar soporte inicial y derivar según norma.",
        "Solo prescribir descanso y control posterior.",
        "Ignorar el antecedente para evitar revictimización."
      ],
      correct: 0,
      feedback: "Primero se debe tamizar, brindar soporte inicial y definir derivación según el nivel de riesgo."
    },
    {
      id: 3,
      block: "Psicología",
      title: "Ataque de pánico en consulta",
      level: "I-2",
      specialty: "Psicología",
      tags: ["ansiedad", "crisis", "contención"],
      statement: "Paciente de 24 años presenta respiración rápida, sensación de muerte inminente y temor intenso.",
      question: "¿Qué medida inicial es la más adecuada?",
      options: [
        "Brindar contención, evaluación breve y manejo inicial.",
        "Administrar cualquier sedante sin evaluación.",
        "Citar en un mes sin intervención."
      ],
      correct: 0,
      feedback: "La prioridad es contener, evaluar y estabilizar antes de definir derivación."
    },
    {
      id: 4,
      block: "Psicología",
      title: "Depresión y baja adherencia",
      level: "I-3",
      specialty: "Psicología",
      tags: ["depresión", "seguimiento", "adherencia"],
      statement: "Usuario con depresión leve abandona tratamiento y manifiesta poca motivación.",
      question: "¿Cuál es la mejor estrategia inicial?",
      options: [
        "Educar, reforzar adherencia y programar seguimiento.",
        "Suspender el control por falta de interés.",
        "Indicar que vuelva solo si empeora."
      ],
      correct: 0,
      feedback: "Debe reforzarse adherencia, educación y seguimiento periódico."
    },
    {
      id: 5,
      block: "Salud pública",
      title: "Brote diarreico en comunidad",
      level: "I-2",
      specialty: "Medicina / Salud Pública",
      tags: ["vigilancia", "brotes", "notificación"],
      statement: "En una comunidad rural se identifican 8 personas con diarrea aguda tras una actividad comunal con agua no segura.",
      question: "¿Cuál es la primera acción correcta?",
      options: [
        "Esperar confirmación de laboratorio antes de actuar.",
        "Notificar, iniciar investigación y control del evento.",
        "Dar tratamiento individual y cerrar el caso."
      ],
      correct: 1,
      feedback: "En brotes, la prioridad es notificar, investigar y activar medidas de control."
    },
    {
      id: 6,
      block: "Cuidado integral",
      title: "Hipertensión no controlada",
      level: "I-3",
      specialty: "Enfermería / Medicina",
      tags: ["crónicos", "adherencia", "control"],
      statement: "Paciente de 58 años con hipertensión y tres controles elevados refiere olvido frecuente de medicamentos.",
      question: "¿Qué estrategia inicial corresponde?",
      options: [
        "Suspender el tratamiento y reevaluar en 6 meses.",
        "Refuerzo de adherencia, educación y control programado.",
        "Indicar solo dieta y no registrar seguimiento."
      ],
      correct: 1,
      feedback: "El manejo inicial debe reforzar adherencia, educación y seguimiento programado."
    },
    {
      id: 7,
      block: "Ética e interculturalidad",
      title: "Consentimiento y lengua originaria",
      level: "I-2",
      specialty: "Psicología / Medicina",
      tags: ["consentimiento", "idioma", "derechos"],
      statement: "Paciente quechuahablante requiere procedimiento y no comprende la explicación en castellano.",
      question: "¿Qué debe hacerse?",
      options: [
        "Proceder sin explicación para no retrasar la atención.",
        "Brindar información comprensible y asegurar consentimiento informado.",
        "Pedir que firme sin aclarar dudas."
      ],
      correct: 1,
      feedback: "La atención ética exige información comprensible y consentimiento informado."
    },
    {
      id: 8,
      block: "Gestión",
      title: "Referencia de emergencia",
      level: "I-4",
      specialty: "Gestión / Medicina",
      tags: ["referencia", "estabilización", "continuidad"],
      statement: "Paciente con signos de shock requiere traslado a mayor complejidad.",
      question: "¿Qué paso es prioritario?",
      options: [
        "Enviar inmediatamente sin estabilizar.",
        "Estabilizar y coordinar referencia con continuidad asistencial.",
        "Esperar al familiar para decidir."
      ],
      correct: 1,
      feedback: "La prioridad es estabilizar antes de coordinar la referencia."
    }
  ],
  norms: [
    {
      title: "Ley N.° 23330",
      code: "SERUMS",
      summary: "Ley del Servicio Rural y Urbano Marginal de Salud.",
      detail: "Norma base del SERUMS publicada en GOB.PE y perteneciente al compendio normativo SERUMS."
    },
    {
      title: "Bibliografía oficial 2026",
      code: "MINSA",
      summary: "Compendio de documentos que sustenta la evaluación SERUMS.",
      detail: "La bibliografía oficial organiza contenidos en salud pública, cuidado integral, ética e interculturalidad, gestión e investigación."
    },
    {
      title: "Normativas de evaluación",
      code: "MINSA",
      summary: "Directivas y resoluciones para la evaluación SERUMS.",
      detail: "Incluye resoluciones ministeriales y lineamientos publicados por el MINSA."
    }
  ],
  decrees: [
    {
      title: "Implementación de evaluación SERUMS",
      code: "DS y RM",
      summary: "Disposiciones para la implementación y operación de la evaluación.",
      detail: "Se deja un contenedor expandible para alojar el detalle normativo oficial vigente."
    },
    {
      title: "Lineamientos de gestión SERUMS",
      code: "MINSA",
      summary: "Reglas operativas para proceso, supervisión y término del servicio.",
      detail: "Base para registrar procedimientos y anexos sin alterar la interfaz."
    }
  ],
  resources: [
    { title: "Resumen de estudio", type: "PDF", summary: "Apuntes por bloque temático." },
    { title: "Simulador de casos", type: "Interactivo", summary: "Casos con retroalimentación inmediata." },
    { title: "Compendio normativo", type: "Normas", summary: "Leyes, resoluciones y lineamientos." }
  ]
};window.SERUMS_DATA = {
  scoreKey: "serumsScore",
  caseStateKey: "serumsCaseState",
  notesKey: "serumsNotes",
  cases: [
    {
      id: 1,
      block: "Salud pública",
      title: "Brote diarreico en comunidad",
      level: "I-2",
      specialty: "Medicina / Salud Pública",
      tags: ["vigilancia", "brotes", "notificación"],
      statement: "En una comunidad rural se identifican 8 personas con diarrea aguda tras una actividad comunal con agua no segura.",
      question: "¿Cuál es la primera acción correcta?",
      options: [
        "Esperar confirmación de laboratorio antes de actuar.",
        "Notificar, iniciar investigación y control del evento.",
        "Dar tratamiento individual y cerrar el caso."
      ],
      correct: 1,
      feedback: "En brotes, la prioridad es notificar, investigar y activar medidas de control."
    },
    {
      id: 2,
      block: "Cuidado integral",
      title: "Hipertensión no controlada",
      level: "I-3",
      specialty: "Enfermería / Medicina",
      tags: ["crónicos", "adherencia", "control"],
      statement: "Paciente de 58 años con hipertensión y tres controles elevados refiere olvido frecuente de medicamentos.",
      question: "¿Qué estrategia inicial corresponde?",
      options: [
        "Suspender el tratamiento y reevaluar en 6 meses.",
        "Refuerzo de adherencia, educación y control programado.",
        "Indicar solo dieta y no registrar seguimiento."
      ],
      correct: 1,
      feedback: "El manejo inicial debe reforzar adherencia, educación y seguimiento programado."
    },
    {
      id: 3,
      block: "Ética e interculturalidad",
      title: "Consentimiento y lengua originaria",
      level: "I-2",
      specialty: "Psicología / Medicina",
      tags: ["consentimiento", "idioma", "derechos"],
      statement: "Paciente quechuahablante requiere procedimiento y no comprende la explicación en castellano.",
      question: "¿Qué debe hacerse?",
      options: [
        "Proceder sin explicación para no retrasar la atención.",
        "Brindar información comprensible y asegurar consentimiento informado.",
        "Pedir que firme sin aclarar dudas."
      ],
      correct: 1,
      feedback: "La atención ética exige información comprensible y consentimiento informado."
    },
    {
      id: 4,
      block: "Gestión",
      title: "Referencia de emergencia",
      level: "I-4",
      specialty: "Gestión / Medicina",
      tags: ["referencia", "estabilización", "continuidad"],
      statement: "Paciente con signos de shock requiere traslado a mayor complejidad.",
      question: "¿Qué paso es prioritario?",
      options: [
        "Enviar inmediatamente sin estabilizar.",
        "Estabilizar y coordinar referencia con continuidad asistencial.",
        "Esperar al familiar para decidir."
      ],
      correct: 1,
      feedback: "La prioridad es estabilizar antes de coordinar la referencia."
    }
  ],
  norms: [
    {
      title: "Ley N.° 23330",
      code: "SERUMS",
      summary: "Ley del Servicio Rural y Urbano Marginal de Salud.",
      detail: "Norma base del SERUMS publicada en GOB.PE y perteneciente al compendio normativo SERUMS."
    },
    {
      title: "Bibliografía oficial 2026",
      code: "MINSA",
      summary: "Compendio de documentos que sustenta la evaluación SERUMS.",
      detail: "La bibliografía oficial organiza contenidos en salud pública, cuidado integral, ética e interculturalidad, gestión e investigación."
    },
    {
      title: "Normativas de evaluación",
      code: "MINSA",
      summary: "Directivas y resoluciones para la evaluación SERUMS.",
      detail: "Incluye resoluciones ministeriales y lineamientos publicados por el MINSA."
    }
  ],
  decrees: [
    {
      title: "Implementación de evaluación SERUMS",
      code: "DS y RM",
      summary: "Disposiciones para la implementación y operación de la evaluación.",
      detail: "Se deja un contenedor expandible para alojar el detalle normativo oficial vigente."
    },
    {
      title: "Lineamientos de gestión SERUMS",
      code: "MINSA",
      summary: "Reglas operativas para proceso, supervisión y término del servicio.",
      detail: "Base para registrar procedimientos y anexos sin alterar la interfaz."
    }
  ],
  resources: [
    {
      title: "Resumen de estudio",
      type: "PDF",
      summary: "Apuntes por bloque temático."
    },
    {
      title: "Simulador de casos",
      type: "Interactivo",
      summary: "Casos con retroalimentación inmediata."
    },
    {
      title: "Compendio normativo",
      type: "Normas",
      summary: "Leyes, resoluciones y lineamientos."
    }
  ],
  chips: ["salud pública", "cuidado integral", "ética", "gestión", "investigación", "interculturalidad"]
};
