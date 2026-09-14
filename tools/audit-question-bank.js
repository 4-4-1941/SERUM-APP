"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const inputPath = path.resolve(process.argv[2] || path.join(__dirname, "..", "data.js"));

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function loadCases(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: filePath });
  const cases = context.window.SERUMS_DATA && context.window.SERUMS_DATA.cases;
  if (!Array.isArray(cases)) throw new Error("No se encontró window.SERUMS_DATA.cases");
  return cases;
}

function audit(cases) {
  const requiredTextFields = ["title", "block", "level", "statement", "question", "feedback"];
  const issues = [];
  const ids = new Map();
  const questions = new Map();

  cases.forEach((item, index) => {
    const location = `cases[${index}]`;
    if (item.id === undefined || item.id === null || item.id === "") {
      issues.push({ type: "missing_id", location });
    } else if (ids.has(String(item.id))) {
      issues.push({ type: "duplicate_id", location, id: item.id, first: ids.get(String(item.id)) });
    } else {
      ids.set(String(item.id), location);
    }

    requiredTextFields.forEach(field => {
      if (!String(item[field] || "").trim()) issues.push({ type: "missing_field", location, field });
    });
    if (!String(item.career || item.specialty || "").trim()) {
      issues.push({ type: "missing_field", location, field: "career/specialty" });
    }
    if (!Array.isArray(item.options) || item.options.length < 2) {
      issues.push({ type: "invalid_options", location, count: Array.isArray(item.options) ? item.options.length : 0 });
    } else if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct >= item.options.length) {
      issues.push({ type: "invalid_correct", location, correct: item.correct, optionCount: item.options.length });
    }

    const signature = normalize(`${item.question} ${item.statement}`);
    if (signature) {
      if (questions.has(signature)) {
        issues.push({ type: "duplicate_content", location, first: questions.get(signature) });
      } else {
        questions.set(signature, location);
      }
    }
  });

  const byType = issues.reduce((summary, issue) => {
    summary[issue.type] = (summary[issue.type] || 0) + 1;
    return summary;
  }, {});

  return {
    source: inputPath,
    total: cases.length,
    valid: issues.length === 0,
    issueCount: issues.length,
    byType,
    issues
  };
}

try {
  const report = audit(loadCases(inputPath));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.valid ? 0 : 1;
} catch (error) {
  process.stderr.write(`AUDITORIA_FALLIDA: ${error.message}\n`);
  process.exitCode = 2;
}
