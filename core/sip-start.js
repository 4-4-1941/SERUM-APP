navButtons.forEach(btn => btn.addEventListener("click", () => {
  priorityReviewMode = false;
  renderView(btn.dataset.view);
}));
renderView("dashboard");
