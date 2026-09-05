(() => {
  "use strict";

  document.querySelectorAll("button").forEach((button) => {
    const answer = button.nextElementSibling;
    if (!answer || !answer.classList.contains("answer")) return;

    button.removeAttribute("onclick");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    answer.hidden = true;
    answer.style.display = "";

    const originalLabel = button.textContent.trim();
    button.addEventListener("click", () => {
      const willOpen = answer.hidden;
      answer.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
      button.textContent = willOpen ? "Ocultar respuesta" : originalLabel;
    });
  });
})();
