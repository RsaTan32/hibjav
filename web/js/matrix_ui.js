function displaySteps(steps) {
  const activeTab = document.querySelector(".tab-content.active-tab");
  const container = activeTab.querySelector('[id$="-container"]');

  if (!container) return;

  let html = '<div class="steps-container"><h2>Levezetés lépései:</h2>';
  steps.forEach((step, index) => {
    const matrix = step.matrix;
    const cols = matrix[0].length;

    html += `
            <div class="step-card">
                <div class="step-header">
                    <span>${index + 1}. lépés</span>
                    <small>${step.description}</small>
                </div>
                <div class="step-matrix-view" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 5px;">
        `;
    matrix.forEach((row) => {
      row.forEach((val) => {
        const formattedVal = Number.isInteger(val) ? val : val.toFixed(2);
        // JAVÍTÁS: Ne alkalmazzunk cell-zero osztályt automatikusan
        html += `<div class="step-cell">${formattedVal}</div>`;
      });
    });
    html += `</div></div>`;
  });
  html += "</div>";
  container.innerHTML += html;

  setTimeout(() => {
    const stepContainers = document.querySelectorAll(".steps-container");
    const lastContainer = stepContainers[stepContainers.length - 1];
    if (lastContainer) {
      lastContainer.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, 100);
}

// Globálissá tétel az Eel-nek
window.displaySteps = displaySteps;
