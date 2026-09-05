(() => {
  "use strict";

  document.querySelectorAll("button").forEach((button) => {
    const answer = button.nextElementSibling;
    if (!answer || !answer.classList.contains("answer")) return;

    button.removeAttribute("onclick");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    answer.hidden = true;
    answer.style.display = "none";

    const originalLabel = button.textContent.trim();
    button.addEventListener("click", () => {
      const willOpen = answer.hidden;
      answer.hidden = !willOpen;
      answer.style.display = willOpen ? "block" : "none";
      button.setAttribute("aria-expanded", String(willOpen));
      button.textContent = willOpen ? "Ocultar respuesta" : originalLabel;
    });
  });
})();
