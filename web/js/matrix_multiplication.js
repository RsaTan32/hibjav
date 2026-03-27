// ===== MÁTRIX SZORZÁS STATE =====
let matrixMultState = {
  matrixA: null,
  matrixB: null,
  matrixC: null,
  dimA: { rows: 0, cols: 0 },
  dimB: { rows: 0, cols: 0 },
  isMatrixAGenerated: false,
  isMatrixBGenerated: false,
  useModulo: false,
  moduloValue: 13,
};

// ===== MODULO TOGGLE =====
function toggleModulo() {
  const checkbox = document.getElementById("use-modulo");
  const moduloInput = document.getElementById("modulo-value");
  const moduloLabel = document.getElementById("modulo-label");

  matrixMultState.useModulo = checkbox.checked;
  moduloInput.disabled = !checkbox.checked;
  moduloLabel.style.display = checkbox.checked ? "inline" : "none";

  console.log("Modulo mode:", matrixMultState.useModulo);
}

// ===== A MÁTRIX GENERÁLÁSA =====
function generateMatrixA() {
  const rows = parseInt(document.getElementById("matrix-a-rows").value);
  const cols = parseInt(document.getElementById("matrix-a-cols").value);

  if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
    alert("Kérlek adj meg érvényes dimenziókat az A mátrixhoz!");
    return;
  }

  // State frissítése
  matrixMultState.dimA = { rows, cols };
  matrixMultState.isMatrixAGenerated = true;

  console.log(`Generating Matrix A: ${rows}×${cols}`);

  // HTML generálása
  const displayArea = document.getElementById("matrix-display-area");

  let html = `
        <div class="matrix-container">
            <h3>A mátrix (${rows}×${cols})</h3>
            <div class="matrix-wrapper">
                <table class="mult-matrix" id="matrix-a-table">
                    <tbody>
    `;

  for (let r = 0; r < rows; r++) {
    html += `<tr>`;
    for (let c = 0; c < cols; c++) {
      html += `
                <td>
                    <input type="number" 
                           class="matrix-cell-input" 
                           id="a-cell-${r}-${c}"
                           data-row="${r}"
                           data-col="${c}"
                           value="0">
                </td>
            `;
    }
    html += `</tr>`;
  }

  html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

  // Ha B is létezik, mellé tesszük
  if (matrixMultState.isMatrixBGenerated) {
    const existingB = document.getElementById("matrix-b-container");
    if (existingB) {
      displayArea.innerHTML = html + existingB.outerHTML;
    } else {
      displayArea.innerHTML = html;
    }
  } else {
    displayArea.innerHTML = html;
  }

  // Ellenőrizzük a B mátrix kompatibilitását
  checkMatrixCompatibility();
}

// ===== B MÁTRIX GENERÁLÁSA =====
function generateMatrixB() {
  const rows = parseInt(document.getElementById("matrix-b-rows").value);
  const cols = parseInt(document.getElementById("matrix-b-cols").value);

  if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
    alert("Kérlek adj meg érvényes dimenziókat a B mátrixhoz!");
    return;
  }

  // State frissítése
  matrixMultState.dimB = { rows, cols };
  matrixMultState.isMatrixBGenerated = true;

  console.log(`Generating Matrix B: ${rows}×${cols}`);

  // HTML generálása
  let html = `
        <div class="matrix-container" id="matrix-b-container">
            <h3>B mátrix (${rows}×${cols})</h3>
            <div class="matrix-wrapper">
                <table class="mult-matrix" id="matrix-b-table">
                    <tbody>
    `;

  for (let r = 0; r < rows; r++) {
    html += `<tr>`;
    for (let c = 0; c < cols; c++) {
      html += `
                <td>
                    <input type="number" 
                           class="matrix-cell-input" 
                           id="b-cell-${r}-${c}"
                           data-row="${r}"
                           data-col="${c}"
                           value="0">
                </td>
            `;
    }
    html += `</tr>`;
  }

  html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

  const displayArea = document.getElementById("matrix-display-area");

  // Ha A is létezik, elé tesszük
  if (matrixMultState.isMatrixAGenerated) {
    const existingA = document.querySelector(".matrix-container");
    if (existingA) {
      displayArea.innerHTML = existingA.outerHTML + html;
    } else {
      displayArea.innerHTML = html;
    }
  } else {
    displayArea.innerHTML = html;
  }

  // Ellenőrizzük a kompatibilitást
  checkMatrixCompatibility();
}

// ===== KOMPATIBILITÁS ELLENŐRZÉSE =====
function checkMatrixCompatibility() {
  const warningDiv = document.getElementById("matrix-b-warning");
  const multiplyBtn = document.getElementById("multiply-btn");

  if (
    !matrixMultState.isMatrixAGenerated ||
    !matrixMultState.isMatrixBGenerated
  ) {
    warningDiv.style.display = "none";
    multiplyBtn.disabled = true;
    return;
  }

  const aRows = matrixMultState.dimA.rows;
  const aCols = matrixMultState.dimA.cols;
  const bRows = matrixMultState.dimB.rows;
  const bCols = matrixMultState.dimB.cols;

  console.log(
    `Checking compatibility: A(${aRows}×${aCols}) × B(${bRows}×${bCols})`,
  );

  // A mátrix oszlopainak meg kell egyeznie B mátrix soraival
  if (aCols !== bRows) {
    warningDiv.innerHTML = `
            <strong>⚠️ Figyelem!</strong> A mátrixok nem szorzhatók össze!
            <br>Az A mátrix oszlopainak (${aCols}) meg kell egyeznie a B mátrix soraival (${bRows}).
            <br>Módosítsd a B mátrix méretét úgy, hogy a sorok száma <strong>${aCols}</strong> legyen.
        `;
    warningDiv.style.display = "block";
    warningDiv.className = "warning-message error-state";
    multiplyBtn.disabled = true;
  } else {
    warningDiv.innerHTML = `
            <strong>✓ Rendben!</strong> A mátrixok kompatibilisek a szorzáshoz.
            <br>Eredmény mérete: ${aRows}×${bCols}
        `;
    warningDiv.style.display = "block";
    warningDiv.className = "warning-message success-state";
    multiplyBtn.disabled = false;
  }
}

// ===== MÁTRIXOK BEOLVASÁSA =====
function getMatrixData(matrixId) {
  const table = document.getElementById(`matrix-${matrixId}-table`);
  if (!table) return null;

  const rows = table.querySelectorAll("tbody tr");
  let data = [];

  rows.forEach((tr) => {
    let rowData = [];
    const inputs = tr.querySelectorAll("input");
    inputs.forEach((input) => {
      const val = parseFloat(input.value) || 0;
      rowData.push(val);
    });
    data.push(rowData);
  });

  console.log(`Matrix ${matrixId.toUpperCase()} data:`, data);
  return data;
}

// ===== MÁTRIX SZORZÁS VÉGREHAJTÁSA =====
function multiplyMatrices() {
  console.log("\n=== Starting Matrix Multiplication ===");

  // Modulo beállítás frissítése
  const useModulo = document.getElementById("use-modulo").checked;
  const moduloValue = parseInt(document.getElementById("modulo-value").value);

  matrixMultState.useModulo = useModulo;
  matrixMultState.moduloValue = moduloValue;

  console.log("Use modulo:", useModulo);
  console.log("Modulo value:", moduloValue);

  // Mátrixok beolvasása
  matrixMultState.matrixA = getMatrixData("a");
  matrixMultState.matrixB = getMatrixData("b");

  if (!matrixMultState.matrixA || !matrixMultState.matrixB) {
    alert("Hiba: Nem sikerült beolvasni a mátrixokat!");
    return;
  }

  const A = matrixMultState.matrixA;
  const B = matrixMultState.matrixB;

  const aRows = A.length;
  const aCols = A[0].length;
  const bRows = B.length;
  const bCols = B[0].length;

  console.log(`Multiplying: A(${aRows}×${aCols}) × B(${bRows}×${bCols})`);

  // Ellenőrzés
  if (aCols !== bRows) {
    alert(
      `Hiba: A mátrixok nem kompatibilisek! A oszlopai (${aCols}) ≠ B sorai (${bRows})`,
    );
    return;
  }

  // Szorzás C = A × B
  let C = [];
  for (let i = 0; i < aRows; i++) {
    C[i] = [];
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += A[i][k] * B[k][j];
      }

      // MODULO ALKALMAZÁSA, ha be van kapcsolva
      if (useModulo && moduloValue > 0) {
        sum = ((sum % moduloValue) + moduloValue) % moduloValue;
      }

      C[i][j] = sum;
    }
  }

  matrixMultState.matrixC = C;
  console.log("Result matrix C:", C);

  // Eredmény megjelenítése
  displayResult(C, aRows, bCols);
}

// ===== EREDMÉNY MEGJELENÍTÉSE =====
function displayResult(C, rows, cols) {
  const resultArea = document.getElementById("result-display-area");

  const useModulo = matrixMultState.useModulo;
  const moduloValue = matrixMultState.moduloValue;

  const moduloText = useModulo ? ` (mod ${moduloValue})` : "";

  let html = `
        <div class="result-card">
            <h3>Eredmény: C = A × B${moduloText}</h3>
            <p class="matrix-info">
                <strong>Méret:</strong> ${rows}×${cols}
                ${useModulo ? `<br><strong>Számolás:</strong> Z<sub>${moduloValue}</sub> felett` : ""}
            </p>
            <div class="matrix-wrapper">
                <table class="result-matrix">
                    <tbody>
    `;

  for (let r = 0; r < rows; r++) {
    html += `<tr>`;
    for (let c = 0; c < cols; c++) {
      const value = C[r][c];
      // Formázás: ha egész szám, akkor egészként, egyébként 2 tizedesre
      const displayValue = Number.isInteger(value) ? value : value.toFixed(2);
      html += `<td><div class="result-cell">${displayValue}</div></td>`;
    }
    html += `</tr>`;
  }

  html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

  resultArea.innerHTML = html;

  // Smooth scroll az eredményhez
  setTimeout(() => {
    resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
}

// ===== TÖRLÉS =====
function clearMultiplication() {
  matrixMultState = {
    matrixA: null,
    matrixB: null,
    matrixC: null,
    dimA: { rows: 0, cols: 0 },
    dimB: { rows: 0, cols: 0 },
    isMatrixAGenerated: false,
    isMatrixBGenerated: false,
  };

  document.getElementById("matrix-display-area").innerHTML = "";
  document.getElementById("result-display-area").innerHTML = "";
  document.getElementById("matrix-b-warning").style.display = "none";
  document.getElementById("multiply-btn").disabled = true;

  console.log("Matrices cleared");
}
