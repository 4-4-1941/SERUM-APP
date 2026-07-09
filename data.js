const appData = {
  dashboard: {
    metrics: [
      { label: "Casos completados", value: 24 },
      { label: "Precisión promedio", value: 78 },
      { label: "Tiempo medio", value: "7:42" }
    ],
    progress: [
      { label: "Salud Pública", value: 72 },
      { label: "Cuidado Integral", value: 81 },
      { label: "Gestión", value: 64 },
      { label: "Ética", value: 88 },
      { label: "Investigación", value: 55 }
    ]
  },
  cases: [
    {
      id: 1,
      title: "Riesgo suicida en adolescente",
      level: "I-2",
      specialty: "Psicología",
      status: "Crítico",
      summary: "Identificar riesgo, contener y referir.",
      statement: "Adolescente de 16 años llega al establecimiento I-2 con ideación suicida, aislamiento, antecedente de violencia familiar y soporte limitado.",
      decision: "Intervenir en crisis, estabilizar y derivar urgentemente."
    },
    {
      id: 2,
      title: "Violencia familiar con ansiedad",
      level: "I-2",
      specialty: "Psicología",
      status: "Medio",
      summary: "Tamizaje, soporte y derivación.",
      statement: "Mujer adulta consulta por insomnio, ansiedad y dolor somático. Refiere episodios de violencia familiar y temor al regresar a casa.",
      decision: "Tamizar, brindar soporte inicial y derivar según norma."
    }
  ],
  norms: [
    "Ley N.° 30947 - Ley de Salud Mental",
    "D.S. N.° 007-2020-SA - Reglamento",
    "Normatividad MINSA sobre salud mental"
  ]
};
