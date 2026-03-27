// ===== STATE MANAGEMENT =====
let parityState = {
  currentPivotRow: 0,
  isPickingPivot: false,
  currentMatrix: [],
  originalMatrix: [],
  rowLabels: [],
  colLabels: [],
  k: 0,
  n: 0,
  completedPivots: [],
  modulus: 13,
};

// ===== INITIALIZATION =====
function generateParityGrid() {
  const k = parseInt(document.getElementById("rows-p").value);
  const n = parseInt(document.getElementById("cols-p").value);
  const modulus = parseInt(document.getElementById("modulus-p").value);
  const container = document.getElementById("parity-container");

  // Validation
  if (isNaN(k) || isNaN(n) || isNaN(modulus)) {
    showError("Kérlek adj meg érvényes dimenziókat és modulust!");
    return;
  }

  if (k <= 0 || n <= 0) {
    showError("A dimenzióknak pozitívnak kell lenniük!");
    return;
  }

  if (k >= n) {
    showError("A k értékének kisebbnek kell lennie, mint n (k < n)!");
    return;
  }

  if (modulus < 2) {
    showError("A modulus értékének legalább 2-nek kell lennie!");
    return;
  }

  // Reset state
  parityState = {
    currentPivotRow: 0,
    isPickingPivot: false,
    currentMatrix: [],
    originalMatrix: [],
    rowLabels: Array.from({ length: k }, (_, i) => `e<sub>${i + 1}</sub>`),
    colLabels: Array.from({ length: n }, (_, i) => `g<sub>${i + 1}</sub>`),
    k: k,
    n: n,
    completedPivots: [],
    modulus: modulus,
  };

  console.log("Initializing parity grid:", parityState);

  let html = `
        <div class="matrix-wrapper">
            <div class="modulus-display">Számítás Z<sub>${modulus}</sub> felett</div>
            <table class="labeled-matrix" id="p-matrix-table">
                <thead>
                    <tr>
                        <th></th>`;

  // Column labels
  for (let i = 0; i < n; i++) {
    html += `<th class="col-label" id="col-label-${i}">${parityState.colLabels[i]}</th>`;
  }

  html += `</tr></thead><tbody>`;

  // Matrix rows
  for (let r = 0; r < k; r++) {
    html += `<tr><td class="row-label" id="row-label-${r}">${parityState.rowLabels[r]}</td>`;
    for (let c = 0; c < n; c++) {
      html += `
                <td>
                    <input type="number" 
                           class="matrix-cell-input" 
                           id="p-cell-${r}-${c}" 
                           data-row="${r}" 
                           data-col="${c}" 
                           value="0"
                           min="0"
                           max="${modulus - 1}">
                </td>`;
    }
    html += `</tr>`;
  }

  html += `
            </tbody>
        </table>
        </div>
        <div class="manual-control-panel">
            <h3>Műveletek</h3>
            <div id="dynamic-controls">
                <button class="btn-success" onclick="startParityCalc()">
                    H kiszámítása (Szisztematikus alak)
                </button>
                <button class="btn-secondary" onclick="clearParityMatrix()">
                    Mátrix törlése
                </button>
            </div>
            <div id="status-message"></div>
        </div>
        <div id="steps-display"></div>
    `;

  container.innerHTML = html;
  console.log("Parity grid generated successfully with modulus:", modulus);

  setTimeout(() => {
    attachInputValidation();
  }, 100);
}

// ===== CALCULATION START =====
async function startParityCalc() {
  console.log("\n=== Starting Parity Calculation ===");

  // Get current matrix
  parityState.currentMatrix = getParityMatrixData();

  // ÚJ: Mentjük az EREDETI mátrixot (mély másolat!)
  parityState.originalMatrix = JSON.parse(
    JSON.stringify(parityState.currentMatrix),
  );

  console.log(
    "Original matrix (saved for verification):",
    parityState.originalMatrix,
  );
  console.log("Current matrix:", parityState.currentMatrix);
  console.log("Modulus:", parityState.modulus);

  // Validate matrix
  if (!validateMatrix(parityState.currentMatrix, parityState.modulus)) {
    showError(
      `Érvénytelen mátrix adatok! Ellenőrizd az értékeket (0-${parityState.modulus - 1} között).`,
    );
    return;
  }

  // Reset state
  parityState.currentPivotRow = 0;
  parityState.isPickingPivot = true;
  parityState.completedPivots = [];

  // Make all non-zero cells selectable
  enablePivotSelection();

  updateStatus(
    `
        <strong>1. lépés:</strong> Válassz pivot elemet a(z) 
        <span class="highlight">${parityState.currentPivotRow + 1}. sorhoz</span>!
        <br><small>Csak nem-nulla elemeket választhatsz (Z<sub>${parityState.modulus}</sub> felett).</small>
    `,
    "info",
  );

  console.log("Pivot selection enabled for row:", parityState.currentPivotRow);
}

// ===== INPUT VALIDATION =====
function validateMatrixInput(input) {
  const val = parseInt(input.value);
  const max = parseInt(input.getAttribute("max")) || parityState.modulus - 1;

  if (isNaN(val) || val < 0 || val > max) {
    input.classList.add("invalid");
    setTimeout(() => input.classList.remove("invalid"), 500);
    input.value = Math.max(0, Math.min(max, val || 0));
  }
}

// Add input validation on change
function attachInputValidation() {
  document.querySelectorAll(".matrix-cell-input").forEach((input) => {
    input.addEventListener("change", function () {
      validateMatrixInput(this);
    });

    input.addEventListener("blur", function () {
      validateMatrixInput(this);
    });
  });
}

// ===== PIVOT SELECTION =====
function enablePivotSelection() {
  console.log("Enabling pivot selection...");
  console.log("Current pivot row:", parityState.currentPivotRow);
  console.log("Completed pivots:", parityState.completedPivots);
  console.log("Current modulus", parityState.modulus);

  updateParityTable(parityState.currentMatrix);

  // Get current matrix values
  const currentData = getParityMatrixData();
  console.log("Current matrix data:", currentData);

  // Remove all previous handlers and classes
  document.querySelectorAll(".matrix-cell-input").forEach((input) => {
    input.classList.remove(
      "pivot-selectable",
      "pivot-selected",
      "cell-disabled",
    );
    input.onclick = null;
    input.readOnly = false;
  });

  let selectableCount = 0;

  // Add handlers to appropriate cells
  document.querySelectorAll(".matrix-cell-input").forEach((input) => {
    const row = parseInt(input.getAttribute("data-row"));
    const col = parseInt(input.getAttribute("data-col"));
    const value = currentData[row][col];

    // Only enable non-zero cells that aren't in already-pivoted columns
    const isPivotedColumn = parityState.completedPivots.includes(col);

    console.log(
      `Cell [${row},${col}]: value=${value}, isPivotedColumn=${isPivotedColumn}`,
    );

    const isValidValue = value > 0 && value < parityState.modulus;

    if (isValidValue && !isPivotedColumn) {
      input.classList.add("pivot-selectable");
      input.readOnly = true;

      // FONTOS: Az eseménykezelőt közvetlenül a DOM elemhez kötjük
      input.onclick = function () {
        console.log(`!!! CLICK EVENT FIRED on cell [${row}, ${col}] !!!`);
        handleCellClick(row, col, value);
      };

      selectableCount++;
      console.log(`  -> Cell [${row},${col}] is SELECTABLE (value: ${value})`);
    } else {
      input.classList.add("cell-disabled");
      input.readOnly = true;
      input.onclick = null;
      console.log(`  -> Cell [${row},${col}] is DISABLED`);
    }
  });

  console.log(
    `Pivot selection enabled. ${selectableCount} cells are selectable.`,
  );

  if (selectableCount === 0) {
    showError("Nincs választható pivot elem! Ellenőrizd a mátrixot.");
  }
}

// ===== CELL CLICK HANDLER =====
async function handleCellClick(row, col, value) {
  console.log(
    `\n!!! handleCellClick called: row=${row}, col=${col}, value=${value} !!!`,
  );
  console.log(`isPickingPivot: ${parityState.isPickingPivot}`);
  console.log(`Modulus: ${parityState.modulus}`);

  if (!parityState.isPickingPivot) {
    console.warn("Not in pivot selection mode");
    return;
  }

  console.log(`\n--- Cell clicked: [${row}, ${col}] with value ${value} ---`);

  // Validation - JAVÍTOTT
  if (value === 0) {
    showError("Zéró elem nem lehet pivot!");
    return;
  }

  if (value < 0 || value >= parityState.modulus) {
    showError(
      `Érvénytelen pivot érték (${value})! Az értéknek 1 és ${parityState.modulus - 1} között kell lennie.`,
    );
    return;
  }

  // Check if column already used
  if (parityState.completedPivots.includes(col)) {
    showError("Ez az oszlop már fel lett használva pivotként!");
    return;
  }

  // Disable interaction during processing
  parityState.isPickingPivot = false;
  updateStatus("Számolás folyamatban...", "loading");

  const currentData = getParityMatrixData();
  console.log("Sending to Python:", {
    matrix: currentData,
    sel_row: row,
    sel_col: col,
    target_row: parityState.currentPivotRow,
    modulus: parityState.modulus,
  });

  // Validáljuk az adatokat küldés előtt
  if (!validateMatrix(currentData, parityState.modulus)) {
    showError("A mátrix adatok érvénytelenek a küldés előtt!");
    parityState.isPickingPivot = true;
    enablePivotSelection();
    return;
  }

  try {
    // Call Python backend
    const result = await eel.process_interactive_pivot(
      currentData,
      row,
      col,
      parityState.currentPivotRow,
      parityState.modulus,
    )();

    console.log("Received from Python:", result);

    if (result.success) {
      // Báziscsere
      const tempLabel = parityState.rowLabels[row];
      parityState.rowLabels[row] = parityState.colLabels[col];
      parityState.colLabels[col] = tempLabel;

      console.log("Labels swapped:");
      console.log("  Row labels:", parityState.rowLabels);
      console.log("  Col labels:", parityState.colLabels);

      // Update matrix and UI
      parityState.currentMatrix = result.matrix;
      parityState.completedPivots.push(col);

      updateParityTable(result.matrix);
      displaySteps([result]);

      // Move to next pivot
      parityState.currentPivotRow++;

      // Check if we're done
      if (parityState.currentPivotRow < parityState.k) {
        // Continue with next pivot
        parityState.isPickingPivot = true;

        setTimeout(() => {
          enablePivotSelection();
        }, 100);

        updateStatus(
          `
                    <strong>Siker!</strong> Most válassz pivotot a(z) 
                    <span class="highlight">${parityState.currentPivotRow + 1}. sorhoz</span>!
                    <br><small>Már felhasznált oszlopok: ${parityState.completedPivots.map((c) => c + 1).join(", ")}</small>
                `,
          "success",
        );
      } else {
        // All pivots done
        finishParityCalculation();
      }
    } else {
      // Error from Python
      showError(`Hiba a számolás során: ${result.error}`);
      parityState.isPickingPivot = true;
      enablePivotSelection();
    }
  } catch (err) {
    console.error("Error during pivot operation:", err);
    console.error("Stack:", err.stack);
    showError(`Kommunikációs hiba: ${err.message}`);
    parityState.isPickingPivot = true;
    enablePivotSelection();
  }
}

// ===== FINISH CALCULATION =====
async function finishParityCalculation() {
  console.log("\n=== Finishing parity calculation ===");

  updateStatus(
    `
        <strong>Pivotálás kész!</strong> Most rendezzük a mátrixot és számítjuk a paritásmátrixot...
    `,
    "success",
  );

  try {
    // 1. Azonosítsuk a hiányzó g oszlopokat
    const allColumns = Array.from({ length: parityState.n }, (_, i) => i);
    const missingColumns = allColumns.filter(
      (col) => !parityState.completedPivots.includes(col),
    );

    console.log("Pivoted columns:", parityState.completedPivots);
    console.log("Missing columns (need extra rows):", missingColumns);
    console.log(
      "Current matrix before adding rows:",
      parityState.currentMatrix,
    );

    // 2. Adjuk hozzá a hiányzó sorokat (Z-1) értékekkel
    const maxValue = parityState.modulus - 1;
    const extraRows = [];
    const extraRowLabels = [];

    for (const col of missingColumns) {
      const newRow = Array(parityState.n).fill(0);
      newRow[col] = maxValue;
      extraRows.push(newRow);
      extraRowLabels.push(parityState.colLabels[col]);
    }

    console.log("Extra rows to add:", extraRows);
    console.log("Extra row labels:", extraRowLabels);

    // 3. Egyesítsük a mátrixokat
    const combinedMatrix = [...parityState.currentMatrix, ...extraRows];
    const combinedLabels = [...parityState.rowLabels, ...extraRowLabels];

    console.log("Combined matrix:", combinedMatrix);
    console.log("Combined labels:", combinedLabels);

    // 4. Rendezzük a sorokat g1, g2, g3... szerint
    const sortedIndices = combinedLabels
      .map((label, index) => ({ label, index }))
      .sort((a, b) => {
        const numA = parseInt(a.label.match(/>(\d+)</)[1]);
        const numB = parseInt(b.label.match(/>(\d+)</)[1]);
        return numA - numB;
      })
      .map((item) => item.index);

    const sortedMatrix = sortedIndices.map((i) => combinedMatrix[i]);
    const sortedLabels = sortedIndices.map((i) => combinedLabels[i]);

    console.log("Sorted matrix:", sortedMatrix);
    console.log("Sorted labels:", sortedLabels);

    // 5. Jelenítsük meg a rendezett mátrixot
    displaySortedMatrix(sortedMatrix, sortedLabels);

    // 6. Számítsuk ki a paritásmátrixot
    const result = await eel.extract_parity_matrix_extended(
      sortedMatrix,
      parityState.k,
      parityState.n,
      parityState.modulus,
      parityState.completedPivots,
    )();

    console.log("Parity extraction result:", result);

    if (result && result.success) {
      // Jelenítsük meg, hogy melyik oszlopokból lett H
      displayParityMatrixExtraction(
        sortedMatrix,
        sortedLabels,
        result.non_pivoted_columns,
      );

      displayParityMatrix(result.H, result.dimensions);

      // 7. ELLENŐRZÉS: EREDETI G × H^T ≡ 0 (mod Z)
      console.log("=== Starting verification ===");
      console.log("ORIGINAL G (before pivoting):", parityState.originalMatrix);
      console.log("H:", result.H);

      if (!parityState.originalMatrix || !result.H) {
        console.error("Missing data for verification!");
        showError("Hiányzó adatok az ellenőrzéshez!");
        return;
      }

      // KRITIKUS: Az EREDETI mátrixot használjuk!
      await verifyParityMatrix(
        parityState.originalMatrix, // ÚJ: eredeti mátrix!
        result.H,
        parityState.modulus,
      );
    } else {
      const errorMsg = result?.error || "Ismeretlen hiba";
      showError(`Hiba a paritásmátrix kinyerése során: ${errorMsg}`);
    }
  } catch (err) {
    console.error("Error in finishParityCalculation:", err);
    console.error("Stack:", err.stack);
    showError(`Nem sikerült befejezni a számítást: ${err.message}`);
  }
}

// ===== PARITÁSMÁTRIX KINYERÉSÉNEK VIZUALIZÁCIÓJA =====
function displayParityMatrixExtraction(
  sortedMatrix,
  sortedLabels,
  nonPivotedColumns,
) {
  const stepsDiv = document.getElementById("steps-display");

  let html = `
        <div class="extraction-card">
            <h3>Paritásmátrix kinyerése</h3>
            <p class="extraction-info">
                A paritásmátrix (H) a <strong>nem-pivotált oszlopokból</strong> áll.
                <br>Nem-pivotált oszlopok: <strong>${nonPivotedColumns.map((c) => `g<sub>${c + 1}</sub>`).join(", ")}</strong>
            </p>
            
            <table class="extraction-matrix-display">
                <thead>
                    <tr>
                        <th></th>
    `;

  // Oszlop fejlécek
  for (let c = 0; c < parityState.n; c++) {
    const isPivoted = parityState.completedPivots.includes(c);
    const isNonPivoted = nonPivotedColumns.includes(c);
    const headerClass = isNonPivoted ? "col-header-highlight" : "col-header";
    html += `<th class="${headerClass}">g<sub>${c + 1}</sub></th>`;
  }

  html += `</tr></thead><tbody>`;

  // Sorok
  sortedMatrix.forEach((row, r) => {
    html += `<tr>`;
    html += `<td class="row-label">${sortedLabels[r]}</td>`;

    row.forEach((val, c) => {
      const isNonPivoted = nonPivotedColumns.includes(c);
      const cellClass = isNonPivoted
        ? "extraction-cell-highlight"
        : "extraction-cell";
      html += `<td class="${cellClass}">${val}</td>`;
    });

    html += `</tr>`;
  });

  html += `
            </tbody>
        </table>
        
        <div class="extraction-arrow">
            ⬇ Ezek az oszlopok (transzponálva) alkotják H-t ⬇
        </div>
    </div>
    `;

  stepsDiv.innerHTML += html;
}

// ===== DISPLAY PARITY MATRIX =====
function displayParityMatrix(H_matrix, dimensions) {
  console.log("Displaying parity matrix H:", H_matrix);
  console.log("Dimensions:", dimensions);

  if (!H_matrix || H_matrix.length === 0) {
    console.warn("H matrix is empty or undefined");
    showError("A paritásmátrix üres!");
    return;
  }

  const stepsDiv = document.getElementById("steps-display");
  if (!stepsDiv) {
    console.error("steps-display div not found!");
    return;
  }

  // Dimensions ellenőrzése és alapértelmezett értékek
  const rows =
    dimensions && dimensions.rows ? dimensions.rows : H_matrix.length;
  const cols =
    dimensions && dimensions.cols
      ? dimensions.cols
      : H_matrix[0]
        ? H_matrix[0].length
        : 0;

  console.log(`H matrix actual size: ${rows}×${cols}`);

  let html = `
        <div class="result-card">
            <h3>Paritásmátrix (H)</h3>
            <p class="matrix-info">
                <strong>Dimenziók:</strong> ${rows} × ${cols}<br>
                <strong>Formátum:</strong> H = [-P<sup>T</sup> | I<sub>${rows}</sub>] mod 13
            </p>
            <div class="parity-matrix-display" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 8px; margin: 20px 0; width: fit-content;">
    `;

  H_matrix.forEach((row, r) => {
    if (Array.isArray(row)) {
      row.forEach((val, c) => {
        html += `<div class="result-cell">${val}</div>`;
      });
    }
  });

  html += `
            </div>
        </div>
    `;

  stepsDiv.innerHTML += html;

  // Scroll to result
  setTimeout(() => {
    const resultCard = stepsDiv.querySelector(".result-card:last-child");
    if (resultCard) {
      resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, 100);
}

// ===== UI UPDATE FUNCTIONS =====
function updateParityTable(newData) {
  console.log("=== Updating table with new data ===");
  console.log("New data:", newData);
  console.log("Modulus:", parityState.modulus);

  const table = document.getElementById("p-matrix-table");
  if (!table) {
    console.error("Table not found!");
    return;
  }

  // Update column labels
  const colHeaders = table.querySelectorAll("thead th.col-label");
  colHeaders.forEach((th, i) => {
    if (parityState.colLabels[i]) {
      th.innerHTML = parityState.colLabels[i];
      console.log(`Updated col label ${i}:`, parityState.colLabels[i]);
    }
  });

  // Update rows
  const rows = table.querySelectorAll("tbody tr");
  newData.forEach((rowData, r) => {
    // Update row label
    const rowLabel = document.getElementById(`row-label-${r}`);
    if (rowLabel) {
      rowLabel.innerHTML = parityState.rowLabels[r];
      console.log(`Updated row label ${r}:`, parityState.rowLabels[r]);
    }

    // Update cell values
    rowData.forEach((val, c) => {
      const input = document.getElementById(`p-cell-${r}-${c}`);
      if (input) {
        // KRITIKUS JAVÍTÁS: Modulo alkalmazása!
        const moduloValue = val % parityState.modulus;

        // Beállítjuk mindkét módon
        input.value = moduloValue;
        input.setAttribute("value", moduloValue.toString());

        // Data attribútumok újra beállítása
        input.setAttribute("data-row", r.toString());
        input.setAttribute("data-col", c.toString());

        // Max érték frissítése
        input.setAttribute("max", (parityState.modulus - 1).toString());

        // Töröljük az összes osztályt
        input.className = "matrix-cell-input";

        // Visual feedback for completed pivot columns
        if (parityState.completedPivots.includes(c)) {
          input.classList.add("pivot-completed");
        }

        console.log(
          `Updated cell [${r},${c}]: set value to ${moduloValue} (original: ${val}), current value is "${input.value}"`,
        );

        // Ellenőrzés
        if (input.value != moduloValue) {
          console.error(
            `!!! WARNING: Cell [${r},${c}] value mismatch! Expected ${moduloValue}, got ${input.value}`,
          );
          // Újrapróbálás
          input.value = moduloValue;
        }
      } else {
        console.error(`Cell input not found: p-cell-${r}-${c}`);
      }
    });
  });

  console.log("Table updated successfully");
  console.log("Completed pivots:", parityState.completedPivots);

  // ELLENŐRZŐ OLVASÁS: Nézzük meg, mit olvasunk vissza most rögtön
  console.log("=== Verification read after update ===");
  const verifyData = getParityMatrixData();
  console.log("Verified data:", verifyData);

  // Összehasonlítás
  let mismatch = false;
  newData.forEach((row, r) => {
    row.forEach((val, c) => {
      const expectedValue = val % parityState.modulus;
      if (verifyData[r] && verifyData[r][c] !== expectedValue) {
        console.error(
          `!!! MISMATCH at [${r},${c}]: expected ${expectedValue}, got ${verifyData[r][c]}`,
        );
        mismatch = true;
      }
    });
  });

  if (mismatch) {
    console.error("!!! DATA MISMATCH DETECTED!");
  } else {
    console.log("✓ All values verified successfully");
  }
}

// ===== HELPER FUNCTIONS =====
function getParityMatrixData() {
  const table = document.getElementById("p-matrix-table");
  if (!table) {
    console.error("Table not found in getParityMatrixData!");
    return [];
  }

  const rows = table.querySelectorAll("tbody tr");
  let data = [];

  console.log(`getParityMatrixData: Found ${rows.length} rows`);
  console.log(`Current modulus: ${parityState.modulus}`);

  rows.forEach((tr, rowIndex) => {
    let rowData = [];
    const inputs = tr.querySelectorAll("input.matrix-cell-input");

    console.log(`  Row ${rowIndex}: Found ${inputs.length} inputs`);

    inputs.forEach((input, colIndex) => {
      // Parse value and apply modulo
      const rawValue = parseInt(input.value) || 0;
      const val = rawValue % parityState.modulus;

      console.log(
        `    Cell [${rowIndex},${colIndex}]: input.value = "${input.value}", parsed = ${rawValue}, modulo = ${val}`,
      );

      rowData.push(val);
    });

    data.push(rowData);
  });

  console.log("getParityMatrixData returning:", data);
  return data;
}

function validateMatrix(matrix, modulus) {
  console.log("Validating matrix with modulus:", modulus);

  if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
    console.error("Matrix is empty or not an array");
    return false;
  }

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];

    if (!Array.isArray(row)) {
      console.error(`Row ${r} is not an array:`, row);
      return false;
    }

    for (let c = 0; c < row.length; c++) {
      const val = row[c];

      if (isNaN(val)) {
        console.error(`Invalid value at [${r},${c}]: ${val} (NaN)`);
        return false;
      }

      if (val < 0 || val >= modulus) {
        console.error(
          `Invalid value at [${r},${c}]: ${val} (must be 0 <= val < ${modulus})`,
        );
        return false;
      }
    }
  }

  console.log("✓ Matrix validation passed");
  return true;
}

function clearParityMatrix() {
  document.querySelectorAll(".matrix-cell-input").forEach((input) => {
    input.value = 0;
  });

  document.getElementById("steps-display").innerHTML = "";
  updateStatus("", "");

  parityState.isPickingPivot = false;
  parityState.currentPivotRow = 0;
  parityState.completedPivots = [];
}

function updateStatus(message, type = "info") {
  const statusDiv = document.getElementById("status-message");
  if (!statusDiv) return;

  statusDiv.innerHTML = `<div class="status-${type}">${message}</div>`;
  console.log(`Status (${type}):`, message);
}

function showError(message) {
  updateStatus(`<strong>⚠️ Hiba:</strong> ${message}`, "error");
  console.error("Error:", message);
  alert(message); // Fallback alert for critical errors
}

// ===== RENDEZETT MÁTRIX MEGJELENÍTÉSE =====
function displaySortedMatrix(matrix, labels) {
  const stepsDiv = document.getElementById("steps-display");

  let html = `
        <div class="result-card">
            <h3>Rendezett Generátormátrix (G<sub>sys</sub>)</h3>
            <p class="matrix-info">
                <strong>Bázisvektor sorrend:</strong> g<sub>1</sub>, g<sub>2</sub>, ..., g<sub>${parityState.n}</sub>
            </p>
            <table class="sorted-matrix-display">
                <tbody>
    `;

  matrix.forEach((row, r) => {
    html += `<tr>`;
    html += `<td class="row-label">${labels[r]}</td>`;
    row.forEach((val) => {
      html += `<td class="result-cell">${val}</td>`;
    });
    html += `</tr>`;
  });

  html += `
                </tbody>
            </table>
        </div>
    `;

  stepsDiv.innerHTML += html;
}

// ===== ELLENŐRZÉS G × H^T ≡ 0 =====
async function verifyParityMatrix(G_original, H, modulus) {
  console.log("Verifying: G_original × H^T mod", modulus);
  console.log("G_original:", G_original);
  console.log("H:", H);

  const stepsDiv = document.getElementById("steps-display");

  if (!stepsDiv) {
    console.error("steps-display element not found!");
    showError("Nem található a megjelenítő elem!");
    return;
  }

  try {
    const result = await eel.verify_parity_check(G_original, H, modulus)();

    console.log("Verification result:", result);

    if (!result.success) {
      showError(`Ellenőrzési hiba: ${result.error}`);
      return;
    }

    // Vizuális megjelenítés
    let html = `
            <div class="verification-card ${result.is_valid ? "success" : "error"}">
                <h3>${result.is_valid ? "✓" : "⚠"} Ellenőrzés: G × H<sup>T</sup> ≡ 0 (mod ${modulus})</h3>
                
                <div class="verification-note">
                    <strong>Fontos:</strong> Az ellenőrzéshez az <em>eredeti, pivotálás előtti</em> G mátrixot használjuk!
                </div>
                
                <div class="verification-steps">
                    <div class="verification-step">
                        <h4>1. Eredeti Generátormátrix (G)</h4>
                        <p class="matrix-description">Pivotálás előtti állapot</p>
                        ${renderMatrix(result.G, "G")}
                    </div>
                    
                    <div class="verification-operator">×</div>
                    
                    <div class="verification-step">
                        <h4>2. Paritásmátrix transzponáltja (H<sup>T</sup>)</h4>
                        ${renderMatrix(result.H_T, "H^T")}
                    </div>
                    
                    <div class="verification-operator">=</div>
                    
                    <div class="verification-step">
                        <h4>3. Eredmény (mod ${modulus})</h4>
                        ${renderMatrix(result.product, "Result", result.is_valid)}
                    </div>
                </div>
                
                ${
                  result.is_valid
                    ? `
                    <div class="verification-conclusion success">
                        <strong>✓ A paritásmátrix helyes!</strong>
                        <p>Minden elem 0, így G × H<sup>T</sup> ≡ 0 (mod ${modulus}) teljesül.</p>
                    </div>
                `
                    : `
                    <div class="verification-conclusion error">
                        <strong>⚠ A paritásmátrix hibás!</strong>
                        <p>Az eredmény nem 0 mátrix. Ellenőrizd a számításokat!</p>
                    </div>
                `
                }
            </div>
        `;

    stepsDiv.innerHTML += html;

    // Scroll to verification
    setTimeout(() => {
      const verificationCard = stepsDiv.querySelector(
        ".verification-card:last-child",
      );
      if (verificationCard) {
        verificationCard.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);

    // Update status
    if (result.is_valid) {
      updateStatus(
        `
                <strong>✓ Sikeres számítás és ellenőrzés!</strong>
                <br><button class="btn-primary" onclick="generateParityGrid()">Új számítás</button>
            `,
        "success",
      );
    } else {
      updateStatus(
        `
                <strong>⚠ Ellenőrzés sikertelen!</strong> A paritásmátrix nem megfelelő.
                <br><button class="btn-primary" onclick="generateParityGrid()">Új számítás</button>
            `,
        "error",
      );
    }
  } catch (err) {
    console.error("Error during verification:", err);
    console.error("Error stack:", err.stack);

    stepsDiv.innerHTML += `
            <div class="verification-card error">
                <h3>⚠ Ellenőrzési hiba történt</h3>
                <div class="verification-conclusion error">
                    <strong>Hiba:</strong>
                    <p>${err.message || "Ismeretlen hiba az ellenőrzés során"}</p>
                </div>
            </div>
        `;

    showError(`Nem sikerült az ellenőrzés: ${err.message}`);
  }
}

// =====  ELLENŐRZÉS G X H^T ≡ 0 =====
async function verifyParityMatrix(G, H, modulus) {
  console.log("Verifying: G x H^T mod", modulus);

  try {
    const result = await eel.verify_parity_check(G, H, modulus)();

    const stepsDiv = document.getElementById("steps-display");

    if (!result.success) {
      showError(`Ellenőrzési hiba: ${result.error}`);
      return;
    }

    let html = `
            <div class="verification-card ${result.is_valid ? "success" : "error"}">
                <h3>${result.is_valid ? "✓" : "⚠"} Ellenőrzés: G × H<sup>T</sup> ≡ 0 (mod ${modulus})
                </h3>
                 <div class="verification-steps">
                    <div class="verification-step">
                        <h4>1. Generátormátrix (G)</h4>
                        ${renderMatrix(result.G, "G")}
                    </div>
                    
                    <div class="verification-operator">×</div>
                    
                    <div class="verification-step">
                        <h4>2. Paritásmátrix transzponáltja (H<sup>T</sup>)</h4>
                        ${renderMatrix(result.H_T, "H^T")}
                    </div>
                    
                    <div class="verification-operator">=</div>
                    
                    <div class="verification-step">
                        <h4>3. Eredmény (mod ${modulus})</h4>
                        ${renderMatrix(result.product, "Result", result.is_valid)}
                    </div>
                </div>
                
                ${
                  result.is_valid
                    ? `
                    <div class="verification-conclusion success">
                        <strong>✓ A paritásmátrix helyes!</strong>
                        <p>Minden elem 0, így G × H<sup>T</sup> ≡ 0 (mod ${modulus}) teljesül.</p>
                    </div>
                `
                    : `
                    <div class="verification-conclusion error">
                        <strong>⚠ A paritásmátrix hibás!</strong>
                        <p>Az eredmény nem 0 mátrix. Ellenőrizd a számításokat!</p>
                    </div>
                `
                }
            </div>
        `;

    stepsDiv.innerHTML += html;

    setTimeout(() => {
      const verificationCard = stepsDiv.querySelector(
        ".verification-card:last-child",
      );
      if (verificationCard) {
        verificationCard.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);

    if (result.is_valid) {
      updateStatus(
        `
                <strong>✓ Sikeres számítás és ellenőrzés!</strong>
                <br><button class="btn-primary" onclick="generateParityGrid()">Új számítás</button>
            `,
        "success",
      );
    } else {
      updateStatus(
        `
                <strong>⚠ Ellenőrzés sikertelen!</strong> A paritásmátrix nem megfelelő.
                <br><button class="btn-primary" onclick="generateParityGrid()">Új számítás</button>
            `,
        "error",
      );
    }
  } catch (err) {
    console.error("Error during verification:", err);
    showError("Nem sikerült az ellenőrzés.");
  }
}

// ===== HELPER: MÁTRIX RENDERELÉS =====
function renderMatrix(matrix, label, isZeroMatrix = false) {
  if (!matrix || matrix.length === 0) {
    return `<p class="error-text">Nincs mátrix adat</p>`;
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  let html = `
        <div class="matrix-display-wrapper">
            <div class="matrix-label">${label}</div>
            <table class="verification-matrix">
                <tbody>
    `;

  matrix.forEach((row) => {
    html += `<tr>`;
    row.forEach((val) => {
      const cellClass = val === 0 ? "cell-zero" : "cell-nonzero";
      html += `<td class="matrix-cell ${cellClass}">${val}</td>`;
    });
    html += `</tr>`;
  });

  html += `
                </tbody>
            </table>
            <div class="matrix-dimensions">${rows} × ${cols}</div>
        </div>
    `;

  return html;
}
