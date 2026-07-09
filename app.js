function renderCases() {
  pageTitle.textContent = "Casos interactivos";
  pageSubtitle.textContent = "Abre un filtro y elige una especialidad para ver sus casos.";
  root.innerHTML = `
    <section class="two-col">
      <div class="panel">
        <input id="case-search" class="search" placeholder="Buscar caso, bloque o especialidad..." />

        <details class="filter-box" open>
          <summary>Especialidad</summary>
          <div class="option-list" id="specialty-list"></div>
        </details>

        <details class="filter-box">
          <summary>Bloque temático</summary>
          <div class="option-list" id="block-list"></div>
        </details>

        <div class="case-list" id="case-list"></div>
      </div>

      <div class="panel" id="case-panel">
        <h3 class="section-title">Selecciona un caso</h3>
        <p>Abre un filtro y elige una opción para cargar los casos relacionados.</p>
      </div>
    </section>
  `;

  const list = document.getElementById("case-list");
  const search = document.getElementById("case-search");
  const specialtyList = document.getElementById("specialty-list");
  const blockList = document.getElementById("block-list");

  const specialties = [...new Set(data.cases.map(c => c.specialty))];
  const blocks = [...new Set(data.cases.map(c => c.block))];

  let selectedSpecialty = "";
  let selectedBlock = "";

  function renderFilters() {
    specialtyList.innerHTML = specialties.map(s => `
      <button class="option-btn" data-specialty="${s}">${s}</button>
    `).join("");

    blockList.innerHTML = blocks.map(b => `
      <button class="option-btn" data-block="${b}">${b}</button>
    `).join("");

    specialtyList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSpecialty = btn.dataset.specialty;
        draw(search.value);
      });
    });

    blockList.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedBlock = btn.dataset.block;
        draw(search.value);
      });
    });
  }

  function draw(filter = "") {
    const q = filter.toLowerCase();
    const filtered = data.cases.filter(c => {
      const text = [c.title, c.block, c.specialty, c.statement, ...(c.tags || [])].join(" ").toLowerCase();
      return text.includes(q) &&
        (!selectedSpecialty || c.specialty === selectedSpecialty) &&
        (!selectedBlock || c.block === selectedBlock);
    });

    list.innerHTML = filtered.map(c => `
      <button class="case-card" data-id="${c.id}">
        <span>${c.block} · ${c.level}</span>
        <strong>${c.title}</strong>
        <small>${c.specialty}</small>
        <small>${c.statement}</small>
      </button>
    `).join("");

    list.querySelectorAll(".case-card").forEach(btn => {
      btn.addEventListener("click", () => openCase(Number(btn.dataset.id)));
    });
  }

  search.addEventListener("input", e => draw(e.target.value));
  renderFilters();
  draw();
}
