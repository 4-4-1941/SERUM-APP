"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) continue;
    const key = argv[index].slice(2);
    result[key] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return result;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function loadCurrentCases(filePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: filePath });
  const cases = context.window.SERUMS_DATA && context.window.SERUMS_DATA.cases;
  if (!Array.isArray(cases)) throw new Error("data.js no contiene window.SERUMS_DATA.cases");
  return cases;
}

function inferBlock(specialty) {
  const value = normalize(specialty);
  const rules = [
    ["Ética e interculturalidad", /etica|deontolog|intercultural|derecho|consentimiento/],
    ["Investigación", /investigacion|bioestad|metodolog|psicometr|evidencia cientifica/],
    ["Gestión", /gestion|administracion|calidad|auditoria|referencia|normativa|legislacion|servicios de salud/],
    ["Salud pública", /salud publica|comunitari|epidemiolog|promocion|prevencion|vigilancia|inmuniz|saneamiento/]
  ];
  const match = rules.find(([, pattern]) => pattern.test(value));
  return match ? match[0] : "Cuidado integral";
}

function splitPrompt(enunciado) {
  const text = String(enunciado || "").trim();
  const questionStart = text.lastIndexOf("¿");
  if (questionStart > 0) {
    return {
      statement: text.slice(0, questionStart).trim(),
      question: text.slice(questionStart).trim()
    };
  }
  return { statement: text, question: "Selecciona la alternativa correcta." };
}

function rotateOptions(record, sequence) {
  const letters = ["a", "b", "c", "d", "e"];
  const options = letters.map(letter => record[`alternativa_${letter}`]).filter(value => String(value || "").trim());
  const originalCorrect = letters.indexOf(String(record.respuesta_correcta || "").trim().toLowerCase());
  if (options.length < 2 || originalCorrect < 0 || originalCorrect >= options.length) return null;

  const desiredCorrect = sequence % options.length;
  const shift = (desiredCorrect - originalCorrect + options.length) % options.length;
  const rotated = options.map((_, index) => options[(index - shift + options.length) % options.length]);
  return { options: rotated, correct: desiredCorrect };
}

function buildSignature(value) {
  return normalize(value).slice(0, 500);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = path.resolve(args.source || "");
  const dataPath = path.resolve(args.data || path.join(__dirname, "..", "data.js"));
  const outputPath = path.resolve(args.output || path.join(process.cwd(), "question-batch.json"));
  const profession = String(args.profession || "").trim();
  const limit = Math.max(1, Number(args.limit || 25));

  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error("Indica un archivo JSON existente con --source");
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (!Array.isArray(source)) throw new Error("La fuente debe ser un arreglo JSON");

  const currentCases = loadCurrentCases(dataPath);
  const existingSignatures = new Set(currentCases.flatMap(item => [
    buildSignature(item.statement),
    buildSignature(item.question),
    buildSignature(`${item.statement} ${item.question}`)
  ]).filter(Boolean));
  const seenSource = new Set();
  const maxNumericId = currentCases.reduce((maximum, item) => Number.isFinite(Number(item.id)) ? Math.max(maximum, Number(item.id)) : maximum, 0);
  const selected = [];
  const rejected = [];

  for (const record of source) {
    if (profession && normalize(record.profesion) !== normalize(profession)) continue;
    const signature = buildSignature(record.enunciado);
    if (!signature) {
      rejected.push({ code: record.codigo_pregunta, reason: "empty_question" });
      continue;
    }
    if (seenSource.has(signature)) {
      rejected.push({ code: record.codigo_pregunta, reason: "duplicate_in_source" });
      continue;
    }
    seenSource.add(signature);
    if (existingSignatures.has(signature)) {
      rejected.push({ code: record.codigo_pregunta, reason: "already_in_app" });
      continue;
    }

    const answer = rotateOptions(record, selected.length);
    if (!answer) {
      rejected.push({ code: record.codigo_pregunta, reason: "invalid_options_or_answer" });
      continue;
    }
    const prompt = splitPrompt(record.enunciado);
    selected.push({
      id: maxNumericId + selected.length + 1,
      career: record.profesion,
      specialty: record.especialidad,
      block: inferBlock(record.especialidad),
      level: "Por revisar",
      title: `${record.especialidad} · ${record.codigo_pregunta}`,
      statement: prompt.statement,
      question: prompt.question,
      options: answer.options,
      correct: answer.correct,
      feedback: String(record.justificacion || "").trim(),
      tags: [record.especialidad, record.nivel_dificultad].filter(Boolean),
      source: "BANCOPREGUNTAS.zip",
      sourceId: record.codigo_pregunta,
      sourceOrigin: record.origen || "sin origen declarado",
      unverified: true
    });
    if (selected.length >= limit) break;
  }

  const blockDistribution = selected.reduce((summary, item) => {
    summary[item.block] = (summary[item.block] || 0) + 1;
    return summary;
  }, {});
  const answerDistribution = selected.reduce((summary, item) => {
    const letter = String.fromCharCode(65 + item.correct);
    summary[letter] = (summary[letter] || 0) + 1;
    return summary;
  }, {});

  const result = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: sourcePath,
      profession: profession || "Todas",
      requestedLimit: limit,
      selected: selected.length,
      rejected: rejected.length,
      blockDistribution,
      answerDistribution,
      status: "REVIEW_REQUIRED",
      warning: "No integrar en data.js hasta validar contenido clínico, eje, nivel y fuente."
    },
    questions: selected,
    rejected
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result.metadata, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`PREPARACION_FALLIDA: ${error.message}\n`);
  process.exitCode = 1;
}
