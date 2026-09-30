function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleCaseOptions(original) {
  const order = original.options.map((_, i) => i);
  const shuffledOrder = shuffle(order);
  const newCorrect = shuffledOrder.indexOf(original.correct);
  return { ...original, options: shuffledOrder.map(i => original.options[i]), correct: newCorrect };
}

function reviewPriority(c) {
  const st = caseState[c.id];
  if (!st || !st.attempts) return { tier: 0, date: "" };
  const lastDate = st.lastAttemptDate || (st.history && st.history.length ? st.history[st.history.length - 1].date : "");
  return { tier: st.correct ? 2 : 1, date: lastDate };
}

function sortByPriority(list) {
  return [...list].sort((a, b) => {
    const pa = reviewPriority(a);
    const pb = reviewPriority(b);
    if (pa.tier !== pb.tier) return pa.tier - pb.tier;
    return (pa.date || "").localeCompare(pb.date || "");
  });
}
