(function initSimulacroStatistics(global) {
  "use strict";

  function outcomeChart(correct, incorrect, unanswered, total) {
    const safeTotal = Math.max(1, total);
    const correctPct = Math.round((correct / safeTotal) * 100);
    const incorrectPct = Math.round((incorrect / safeTotal) * 100);
    const unansweredPct = Math.max(0, 100 - correctPct - incorrectPct);
    const secondStop = correctPct + incorrectPct;
    return `<div class="outcome-chart" role="img" aria-label="Distribución: ${correct} correctas, ${incorrect} incorrectas y ${unanswered} no marcadas de ${total} preguntas">
      <div class="outcome-donut" style="--correct-stop:${correctPct}%;--incorrect-stop:${secondStop}%"><div><strong>${correctPct}%</strong><span>Acierto</span></div></div>
      <div class="chart-legend">
        <span><i class="chart-correct"></i><b>Correctas</b><em>${correct} · ${correctPct}%</em></span>
        <span><i class="chart-incorrect"></i><b>Incorrectas</b><em>${incorrect} · ${incorrectPct}%</em></span>
        <span><i class="chart-unanswered"></i><b>No marcadas</b><em>${unanswered} · ${unansweredPct}%</em></span>
      </div>
    </div>`;
  }

  function blockChart(byBlock) {
    return Object.entries(byBlock).map(([block, value]) => {
      const pct = value.total ? Math.round((value.correct / value.total) * 100) : 0;
      return `<div class="axis-bar-row">
        <div class="axis-bar-label"><span>${block}</span><strong>${pct}%</strong></div>
        <div class="axis-bar-track" role="img" aria-label="${block}: ${value.correct} de ${value.total} correctas, ${pct}%"><span style="width:${pct}%"></span></div>
        <small>${value.correct} correctas · ${value.incorrect || 0} incorrectas · ${value.unanswered || 0} no marcadas · total ${value.total}</small>
      </div>`;
    }).join("");
  }

  function historyChart(history) {
    const attempts = history.slice(-8);
    if (!attempts.length) return "";
    const width = 560, height = 190, left = 42, right = 18, top = 18, bottom = 34;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const step = attempts.length > 1 ? plotWidth / (attempts.length - 1) : 0;
    const points = attempts.map((attempt, index) => ({
      x: attempts.length > 1 ? left + index * step : left + plotWidth / 2,
      y: top + plotHeight - (Number(attempt.pct) || 0) / 100 * plotHeight,
      pct: Number(attempt.pct) || 0,
      label: history.length - attempts.length + index + 1
    }));
    const polyline = points.map(point => `${point.x},${point.y}`).join(" ");
    const guides = [0, 25, 50, 75, 100].map(value => {
      const y = top + plotHeight - value / 100 * plotHeight;
      return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="trend-guide"/><text x="${left - 8}" y="${y + 4}" text-anchor="end">${value}%</text>`;
    }).join("");
    const marks = points.map(point => `<g><circle cx="${point.x}" cy="${point.y}" r="5"/><text class="trend-value" x="${point.x}" y="${point.y - 10}" text-anchor="middle">${point.pct}%</text><text x="${point.x}" y="${height - 10}" text-anchor="middle">I${point.label}</text></g>`).join("");
    return `<svg class="history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolución del porcentaje en los últimos ${attempts.length} intentos">${guides}${attempts.length > 1 ? `<polyline points="${polyline}"/>` : ""}${marks}</svg>
      <p class="chart-caption">Últimos ${attempts.length} intento${attempts.length === 1 ? "" : "s"}. Cada porcentaje usa como denominador el total generado.</p>`;
  }

  global.SERUMS_SIMULACRO_STATS = Object.freeze({
    outcomeChart,
    blockChart,
    historyChart
  });
})(window);
