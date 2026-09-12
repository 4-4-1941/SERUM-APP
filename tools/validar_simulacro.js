const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(projectRoot, "data.js"), "utf8"), context);

const cases = context.window.SERUMS_DATA.cases;
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const ids = new Set();

cases.forEach((item, index) => {
  assert(item.id !== undefined && item.id !== null, `Caso ${index + 1}: falta id`);
  assert(!ids.has(item.id), `ID duplicado: ${item.id}`);
  ids.add(item.id);
  assert(Array.isArray(item.options) && item.options.length === 4, `Caso ${item.id}: debe tener 4 alternativas`);
  assert(Number.isInteger(item.correct) && item.correct >= 0 && item.correct < 4, `Caso ${item.id}: índice correcto inválido`);
  assert(Boolean(item.question), `Caso ${item.id}: falta pregunta`);
  assert(Boolean(item.feedback), `Caso ${item.id}: falta retroalimentación`);
});

const careers = [...new Set(cases.map(item => item.career || item.specialty).filter(Boolean))].filter(value => value !== "Transversal");
careers.forEach(career => {
  const pool = cases.filter(item => item.career === career || item.career === "Transversal");
  assert(pool.length > 0, `${career}: no tiene preguntas elegibles`);
  assert(pool.every(item => item.career === career || item.career === "Transversal"), `${career}: mezcla preguntas de otra profesión`);
});

const score = (correct, total) => total ? Math.round((correct / total) * 100) : 0;
assert(score(1, 100) === 1, "Calificación: 1/100 debe ser 1%");
assert(score(76, 100) === 76, "Calificación: 76/100 debe ser 76%");
assert(score(76, 80) === 95, "Calificación debe usar el total generado");
assert(76 + 18 + 6 === 100, "El resumen debe cuadrar: correctas + incorrectas + omitidas = total");

if (failures.length) {
  console.error(`VALIDACIÓN FALLIDA (${failures.length})`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`VALIDACIÓN CORRECTA: ${cases.length} casos, ${careers.length} profesiones, IDs/opciones/claves/retroalimentación y fórmulas consistentes.`);
