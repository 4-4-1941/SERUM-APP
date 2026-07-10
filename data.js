window.SERUMS_DATA = {
  cases: [
    { /* caso 1 */ },
    { /* caso 2 */ },
    { /* ... */ }
  ],
  norms: [
    { /* norma 1 */ }
  ],
  decrees: [
    { /* decreto 1 */ }
  ],
  resources: [
    { /* recurso 1 */ }
  ],
  scoreKey: "score",
  caseStateKey: "caseState",
  notesKey: "notes"
};
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
    block: "Psicología",
    title: "Duelo complicado",
    level: "I-2",
    specialty: "Psicología",
    tags: ["duelo", "acompañamiento", "salud mental"],
    statement: "Paciente expresa insomnio, tristeza intensa y aislamiento tres meses después de una pérdida significativa.",
    question: "¿Qué intervención inicial corresponde?",
    options: [
      "Normalizar sin evaluación y dar alta.",
      "Evaluar impacto funcional y brindar apoyo psicológico.",
      "Derivar solo si tiene síntomas físicos."
    ],
    correct: 1,
    feedback: "Se debe evaluar el impacto funcional y brindar apoyo psicológico oportuno."
  },
  {
    id: 6,
    block: "Psicología",
    title: "Violencia sexual y contención",
    level: "I-2",
    specialty: "Psicología",
    tags: ["violencia sexual", "contención", "ruta de atención"],
    statement: "Mujer joven refiere agresión sexual reciente y presenta llanto, disociación y miedo intenso.",
    question: "¿Cuál es la prioridad?",
    options: [
      "Escuchar, contener y activar la ruta de atención.",
      "Hacerle repetir todos los detalles de inmediato.",
      "Recomendarle que no hable del hecho."
    ],
    correct: 0,
    feedback: "La prioridad es contención emocional y activación de la ruta de atención correspondiente."
  },
  {
    id: 7,
    block: "Psicología",
    title: "Ansiedad generalizada",
    level: "I-3",
    specialty: "Psicología",
    tags: ["ansiedad", "psicoeducación", "seguimiento"],
    statement: "Paciente refiere preocupación excesiva, tensión muscular e insomnio desde hace varios meses.",
    question: "¿Cuál es la conducta inicial correcta?",
    options: [
      "Psicoeducación, evaluación clínica y seguimiento.",
      "Ignorar síntomas por ser leves.",
      "Indicar automedicación con cualquier ansiolítico."
    ],
    correct: 0,
    feedback: "Debe realizarse psicoeducación, evaluación y seguimiento clínico."
  },
  {
    id: 8,
    block: "Psicología",
    title: "Consumo problemático",
    level: "I-3",
    specialty: "Psicología",
    tags: ["sustancias", "tamizaje", "intervención breve"],
    statement: "Joven con consumo frecuente de alcohol niega problemas, pero su familia reporta ausencias laborales.",
    question: "¿Qué estrategia corresponde?",
    options: [
      "Tamizaje e intervención breve motivacional.",
      "Desestimar el caso por negación.",
      "Esperar a que la familia resuelva el problema."
    ],
    correct: 0,
    feedback: "Corresponde tamizaje e intervención breve con enfoque motivacional."
  },
  {
    id: 9,
    block: "Psicología",
    title: "Riesgo de violencia en pareja",
    level: "I-2",
    specialty: "Psicología",
    tags: ["violencia de pareja", "seguridad", "derivación"],
    statement: "Paciente revela control coercitivo por parte de su pareja y temor a represalias.",
    question: "¿Qué acción inicial corresponde?",
    options: [
      "Minimizar el relato para evitar conflicto.",
      "Evaluar riesgo, brindar contención y activar ruta.",
      "Centrarse solo en el insomnio."
    ],
    correct: 1,
    feedback: "Debes evaluar riesgo, brindar contención y activar la ruta de atención."
  },
  {
    id: 10,
    block: "Psicología",
    title: "Estrés laboral severo",
    level: "I-3",
    specialty: "Psicología",
    tags: ["estrés", "burnout", "prevención"],
    statement: "Profesional de salud con irritabilidad, agotamiento y errores frecuentes por sobrecarga.",
    question: "¿Qué intervención inicial es más adecuada?",
    options: [
      "Psicoeducación, evaluación de riesgos y orientación.",
      "Reforzar más horas de trabajo.",
      "Ignorar el problema porque es común."
    ],
    correct: 0,
    feedback: "La mejor conducta es psicoeducación, evaluación y orientación preventiva."
  },
  {
    id: 11,
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
    id: 12,
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
    id: 13,
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
    id: 14,
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
  },
  {
    id: 15,
    block: "Psicología",
    title: "Evaluación de ansiedad en adolescente",
    level: "I-2",
    specialty: "Psicología",
    tags: ["adolescente", "ansiedad", "tamizaje"],
    statement: "Adolescente con irritabilidad, insomnio y bajo rendimiento escolar por preocupación constante.",
    question: "¿Qué paso corresponde primero?",
    options: [
      "Realizar tamizaje y evaluación clínica inicial.",
      "Asignar castigo por bajo rendimiento.",
      "Dar de alta sin registro."
    ],
    correct: 0,
    feedback: "Primero debe hacerse tamizaje y evaluación clínica inicial."
  },
  {
    id: 16,
    block: "Psicología",
    title: "Intervención breve por crisis",
    level: "I-2",
    specialty: "Psicología",
    tags: ["crisis", "intervención breve", "contención"],
    statement: "Paciente con crisis emocional llora, dice no poder continuar y no desea irse sola.",
    question: "¿Cuál es la respuesta inicial adecuada?",
    options: [
      "Acompañamiento, contención y evaluación del riesgo.",
      "Pedirle que vuelva mañana.",
      "Cerrar la consulta por falta de tiempo."
    ],
    correct: 0,
    feedback: "La respuesta correcta es contención, acompañamiento y evaluación del riesgo."
  },
  {
    id: 17,
    block: "Salud pública",
    title: "Cobertura de vacunación",
    level: "I-2",
    specialty: "Salud Pública",
    tags: ["vacunas", "cobertura", "seguimiento"],
    statement: "Una microred presenta coberturas bajas de vacunación infantil en dos comunidades.",
    question: "¿Qué prioridad corresponde?",
    options: [
      "Registrar el problema y planificar seguimiento comunitario.",
      "Esperar a que la demanda aumente sola.",
      "Suspender el reporte por baja asistencia."
    ],
    correct: 0,
    feedback: "Se debe registrar, intervenir y planificar seguimiento comunitario."
  },
  {
    id: 18,
    block: "Cuidado integral",
    title: "Control prenatal tardío",
    level: "I-2",
    specialty: "Obstetricia",
    tags: ["prenatal", "seguimiento", "riesgo"],
    statement: "Gestante de 28 semanas asiste por primera vez a control prenatal.",
    question: "¿Cuál es la acción inicial más adecuada?",
    options: [
      "Iniciar evaluación integral y clasificación de riesgo.",
      "Decirle que espere hasta el parto.",
      "Dar alta por atención tardía."
    ],
    correct: 0,
    feedback: "Debe iniciarse evaluación integral y clasificación de riesgo obstétrico."
  },
  {
    id: 19,
    block: "Psicología",
    title: "Duelo por pérdida reciente",
    level: "I-2",
    specialty: "Psicología",
    tags: ["duelo", "contención", "acompañamiento"],
    statement: "Paciente con pérdida reciente presenta llanto persistente, alteración del sueño y dificultad para trabajar.",
    question: "¿Qué se debe hacer primero?",
    options: [
      "Dar alta porque es una reacción normal.",
      "Evaluar impacto funcional y ofrecer apoyo psicológico.",
      "Evitar hablar del tema."
    ],
    correct: 1,
    feedback: "Se debe evaluar el impacto funcional y ofrecer apoyo psicológico."
  },
  {
    id: 20,
    block: "Psicología",
    title: "Psicoeducación familiar",
    level: "I-2",
    specialty: "Psicología",
    tags: ["familia", "psicoeducación", "seguimiento"],
    statement: "Familia consulta por cambios de conducta en un adolescente y pide orientación para acompañarlo.",
    question: "¿Qué acción es más adecuada?",
    options: [
      "Brindar psicoeducación, orientar señales de alarma y programar seguimiento.",
      "Indicar que no se involucren.",
      "Derivar sin explicar nada."
    ],
    correct: 0,
    feedback: "La mejor conducta es psicoeducar, orientar señales de alarma y programar seguimiento."
  }
]
window.SERUMS_DATA = {
  cases: [...],
  norms: [...],
  decrees: [...],
  resources: [...],
  scoreKey: "score",
  caseStateKey: "caseState",
  notesKey: "notes"
};
