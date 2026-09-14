(() => {
  "use strict";

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  function shuffleOptions(originalCase) {
    if (!originalCase || !Array.isArray(originalCase.options)) return originalCase;
    const order = shuffle(originalCase.options.map((_, index) => index));
    return {
      ...originalCase,
      options: order.map(index => originalCase.options[index]),
      correct: order.indexOf(originalCase.correct)
    };
  }

  function careerLabel(caseItem) {
    const career = caseItem.career || caseItem.specialty || "Sin carrera";
    return career === "Transversal" ? "Todas las profesiones" : career;
  }

  function filterCases(cases, filters = {}) {
    const query = String(filters.query || "").trim().toLowerCase();
    return cases.filter(caseItem => {
      const searchableText = [
        caseItem.title,
        caseItem.block,
        caseItem.specialty,
        caseItem.career,
        caseItem.statement,
        ...(caseItem.tags || [])
      ].filter(Boolean).join(" ").toLowerCase();

      const caseCareer = caseItem.career || caseItem.specialty;
      return (!query || searchableText.includes(query)) &&
        (!filters.career || caseCareer === filters.career || caseItem.career === "Transversal") &&
        (!filters.block || caseItem.block === filters.block) &&
        (!filters.level || caseItem.level === filters.level);
    });
  }

  function sortByReviewPriority(cases, caseState) {
    function priority(caseItem) {
      const state = caseState[caseItem.id];
      if (!state || !state.attempts) return { tier: 0, date: "" };
      const history = Array.isArray(state.history) ? state.history : [];
      const lastDate = state.lastAttemptDate || (history.length ? history[history.length - 1].date : "");
      return { tier: state.correct ? 2 : 1, date: lastDate || "" };
    }

    return [...cases].sort((first, second) => {
      const firstPriority = priority(first);
      const secondPriority = priority(second);
      if (firstPriority.tier !== secondPriority.tier) return firstPriority.tier - secondPriority.tier;
      return firstPriority.date.localeCompare(secondPriority.date);
    });
  }

  window.SERUMS_CASES = Object.freeze({
    careerLabel,
    filterCases,
    shuffle,
    shuffleOptions,
    sortByReviewPriority
  });
})();
