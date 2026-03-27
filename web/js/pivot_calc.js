function generateGrid() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const container = document.getElementById('matrix-container');

    let html = `<div class="matrix-card"><h4>Töltsd ki a mátrixot:</h4><div class="matrix-grid-wrapper" style="display:grid; grid-template-columns: repeat(${cols}, 1fr); gap: 8px;">`;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            html += `<input type="number" class="matrix-input" id="cell-${r}-${c}" value="0" step="any">`;
        }
    }
    html += `</div><div class="matrix-actions"><button class="btn-success" onclick="startPivot()">Pivotálás Indítása</button><button class="btn-outline" onclick="clearMatrix()">Törlés</button></div></div>`;
    container.innerHTML = html;
}

async function startPivot() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    let matrixData = [];
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            const val = parseFloat(document.getElementById(`cell-${r}-${c}`).value);
            row.push(isNaN(val) ? 0 : val);
        }
        matrixData.push(row);
    }
    const result = await eel.solve_matrix(matrixData)();
    displaySteps(result);
}
