// Game parameters
const PUZZLE_COUNT = 15;
let DIMENSIONS = 4;
const NUMBER_RANGE = [2, 9]; // Inclusive range
let SELECTION_COUNT_RANGE = [2, 3]; // Inclusive range

// Store puzzle data
let puzzleData = {};

// Get selection count range based on dimensions
function getSelectionCountRange(dimensions) {
    switch(dimensions) {
        case 3:
            return [2, 2]; // Select exactly 2 numbers
        case 4:
        case 5:
            return [2, 3]; // Select 2-3 numbers
        case 6:
            return [3, 3]; // Select exactly 3 numbers
        default:
            return [2, 3];
    }
}

// Change dimension and regenerate puzzles
function changeDimension() {
    const select = document.getElementById('dimensionSelect');
    DIMENSIONS = parseInt(select.value);
    SELECTION_COUNT_RANGE = getSelectionCountRange(DIMENSIONS);
    generateAllPuzzles();
}

// Generate random integer in range [min, max] inclusive
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a single puzzle
function generatePuzzle() {
    // 1. Create the main grid with random numbers
    const grid = [];
    for (let row = 0; row < DIMENSIONS; row++) {
        grid[row] = [];
        for (let col = 0; col < DIMENSIONS; col++) {
            grid[row][col] = randomInt(NUMBER_RANGE[0], NUMBER_RANGE[1]);
        }
    }

    // 2. Generate a valid selection that satisfies both row and column constraints
    let selectionMatrix = [];
    let maxAttempts = 1000;
    let foundValidSelection = false;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Create a selection matrix (true = selected, false = not selected)
        selectionMatrix = Array(DIMENSIONS).fill().map(() => Array(DIMENSIONS).fill(false));
        
        // Try to fill the selection matrix
        let valid = true;
        for (let row = 0; row < DIMENSIONS; row++) {
            // Count how many are already selected in this row
            let currentSelected = selectionMatrix[row].filter(cell => cell).length;
            let minNeeded = SELECTION_COUNT_RANGE[0] - currentSelected;
            let maxAllowed = SELECTION_COUNT_RANGE[1] - currentSelected;
            
            if (minNeeded > 0) {
                // We need to select at least minNeeded more cells in this row
                let availableCols = [];
                for (let col = 0; col < DIMENSIONS; col++) {
                    if (!selectionMatrix[row][col]) {
                        availableCols.push(col);
                    }
                }
                if (availableCols.length >= minNeeded) {
                    // Select minNeeded cells
                    let colsToSelect = [];
                    let availableColsCopy = [...availableCols];
                    for (let i = 0; i < minNeeded; i++) {
                        let randomIndex = Math.floor(Math.random() * availableColsCopy.length);
                        colsToSelect.push(availableColsCopy[randomIndex]);
                        availableColsCopy.splice(randomIndex, 1);
                    }
                    for (let col of colsToSelect) {
                        selectionMatrix[row][col] = true;
                    }
                } else {
                    // Not enough available cells, try again
                    valid = false;
                    break;
                }
            } else if (maxAllowed > 0) {
                // We can select up to maxAllowed more cells
                let availableCols = [];
                for (let col = 0; col < DIMENSIONS; col++) {
                    if (!selectionMatrix[row][col]) {
                        availableCols.push(col);
                    }
                }
                if (availableCols.length > 0) {
                    let numToSelect = randomInt(0, Math.min(maxAllowed, availableCols.length));
                    if (numToSelect > 0) {
                        let colsToSelect = [];
                        let availableColsCopy = [...availableCols];
                        for (let i = 0; i < numToSelect; i++) {
                            let randomIndex = Math.floor(Math.random() * availableColsCopy.length);
                            colsToSelect.push(availableColsCopy[randomIndex]);
                            availableColsCopy.splice(randomIndex, 1);
                        }
                        for (let col of colsToSelect) {
                            selectionMatrix[row][col] = true;
                        }
                    }
                }
            }
        }
        
        if (valid) {
            // Check if all columns also satisfy constraints
            for (let col = 0; col < DIMENSIONS; col++) {
                let colCount = 0;
                for (let row = 0; row < DIMENSIONS; row++) {
                    if (selectionMatrix[row][col]) colCount++;
                }
                if (colCount < SELECTION_COUNT_RANGE[0] || colCount > SELECTION_COUNT_RANGE[1]) {
                    valid = false;
                    break;
                }
            }
            
            if (valid) {
                // We found a valid selection
                foundValidSelection = true;
                break;
            }
        }
    }
    
    // If we couldn't find a valid selection, create a simple one
    if (!foundValidSelection) {
        selectionMatrix = Array(DIMENSIONS).fill().map(() => Array(DIMENSIONS).fill(false));
        for (let row = 0; row < DIMENSIONS; row++) {
            // Select exactly SELECTION_COUNT_RANGE[0] cells in each row
            let colsToSelect = [];
            let availableCols = Array.from({length: DIMENSIONS}, (_, i) => i);
            for (let i = 0; i < SELECTION_COUNT_RANGE[0]; i++) {
                let randomIndex = Math.floor(Math.random() * availableCols.length);
                colsToSelect.push(availableCols[randomIndex]);
                availableCols.splice(randomIndex, 1);
            }
            for (let col of colsToSelect) {
                selectionMatrix[row][col] = true;
            }
        }
    }

    // 3. Convert selection matrix to row and column selections
    const rowSelections = [];
    for (let row = 0; row < DIMENSIONS; row++) {
        const selectedCols = [];
        for (let col = 0; col < DIMENSIONS; col++) {
            if (selectionMatrix[row][col]) {
                selectedCols.push(col);
            }
        }
        rowSelections.push(selectedCols.sort());
    }

    const colSelections = [];
    for (let col = 0; col < DIMENSIONS; col++) {
        const selectedRows = [];
        for (let row = 0; row < DIMENSIONS; row++) {
            if (selectionMatrix[row][col]) {
                selectedRows.push(row);
            }
        }
        colSelections.push(selectedRows.sort());
    }

    // 4. Calculate row products based on selected numbers
    const rowProducts = [];
    for (let i = 0; i < DIMENSIONS; i++) {
        let product = 1;
        for (let col of rowSelections[i]) {
            product *= grid[i][col];
        }
        rowProducts.push(product);
    }

    // 5. Calculate column products based on the same selected numbers
    const colProducts = [];
    for (let i = 0; i < DIMENSIONS; i++) {
        let product = 1;
        for (let row of colSelections[i]) {
            product *= grid[row][i];
        }
        colProducts.push(product);
    }

    return {
        grid: grid,
        rowProducts: rowProducts,
        colProducts: colProducts,
        rowSelections: rowSelections,
        colSelections: colSelections
    };
}

// Generate HTML for a single puzzle
function createPuzzleHTML(puzzle, puzzleId) {
    // Create main puzzle table
    let tableHTML = '<table class="puzzle-table">';
    
    // Table body with numbers
    for (let row = 0; row < DIMENSIONS; row++) {
        tableHTML += '<tr>';
        for (let col = 0; col < DIMENSIONS; col++) {
            tableHTML += `<td>${puzzle.grid[row][col]}</td>`;
        }
        // Add row product
        tableHTML += `<td class="product-cell">${puzzle.rowProducts[row]}</td>`;
        tableHTML += '</tr>';
    }
    
    // Footer row for column products
    tableHTML += '<tr>';
    for (let col = 0; col < DIMENSIONS; col++) {
        tableHTML += `<td class="product-cell">${puzzle.colProducts[col]}</td>`;
    }
    tableHTML += '<td class="corner-cell"></td>';
    tableHTML += '</tr>';
    tableHTML += '</table>';


    return `
        <div class="puzzle-card" id="puzzle-${puzzleId}" data-dimension="${DIMENSIONS}">
            <h3>Puzzle ${puzzleId}</h3>
            ${tableHTML}
            <div class="button-container">
                <button class="check-btn" onclick="checkSolution(${puzzleId})">Check</button>
                <button class="show-solution-btn" onclick="showSolution(${puzzleId})">Show</button>
                <button class="reset-btn" onclick="resetPuzzle(${puzzleId})">Reset</button>
            </div>
            <div id="result-${puzzleId}"></div>
        </div>
    `;
}

// Generate all puzzles and display them
function generateAllPuzzles() {
    puzzleData = {};
    let puzzleHTML = '';
    
    for (let i = 1; i <= PUZZLE_COUNT; i++) {
        const puzzle = generatePuzzle();
        puzzleData[i] = puzzle;
        puzzleHTML += createPuzzleHTML(puzzle, i);
    }
    
    document.getElementById('puzzleContainer').innerHTML = puzzleHTML;
    
    // Add click event listeners to puzzle cells
    addCellClickListeners();
}

// Add click event listeners to all puzzle cells
function addCellClickListeners() {
    for (let puzzleId = 1; puzzleId <= PUZZLE_COUNT; puzzleId++) {
        const table = document.querySelector(`#puzzle-${puzzleId} .puzzle-table`);
        if (table) {
            const cells = table.querySelectorAll('td');
            cells.forEach((cell, index) => {
                const row = Math.floor(index / (DIMENSIONS + 1));
                const col = index % (DIMENSIONS + 1);
                
                if (row < DIMENSIONS && col < DIMENSIONS) {
                    cell.addEventListener('click', () => toggleCell(puzzleId, row, col));
                }
            });
        }
    }
}

// Update product highlights based on current selection
function updateProductHighlights(puzzleId) {
    const puzzle = puzzleData[puzzleId];
    const cells = document.querySelectorAll(`#puzzle-${puzzleId} .puzzle-table td`);
    
    // Clear all product highlights
    cells.forEach(cell => {
        if (cell.classList.contains('product-cell')) {
            cell.classList.remove('product-correct');
        }
    });
    
    // Check row products
    for (let row = 0; row < DIMENSIONS; row++) {
        let selectedProduct = 1;
        let hasSelection = false;
        
        for (let col = 0; col < DIMENSIONS; col++) {
            const cell = document.querySelector(`#puzzle-${puzzleId} .puzzle-table tr:nth-child(${row + 1}) td:nth-child(${col + 1})`);
            if (cell && cell.classList.contains('selected')) {
                selectedProduct *= puzzle.grid[row][col];
                hasSelection = true;
            }
        }
        
        // If we have selections and the product matches, highlight the row product
        if (hasSelection && selectedProduct === puzzle.rowProducts[row]) {
            const rowProductCell = document.querySelector(`#puzzle-${puzzleId} .puzzle-table tr:nth-child(${row + 1}) td:nth-child(${DIMENSIONS + 1})`);
            if (rowProductCell) {
                rowProductCell.classList.add('product-correct');
            }
        }
    }
    
    // Check column products
    for (let col = 0; col < DIMENSIONS; col++) {
        let selectedProduct = 1;
        let hasSelection = false;
        
        for (let row = 0; row < DIMENSIONS; row++) {
            const cell = document.querySelector(`#puzzle-${puzzleId} .puzzle-table tr:nth-child(${row + 1}) td:nth-child(${col + 1})`);
            if (cell && cell.classList.contains('selected')) {
                selectedProduct *= puzzle.grid[row][col];
                hasSelection = true;
            }
        }
        
        // If we have selections and the product matches, highlight the column product
        if (hasSelection && selectedProduct === puzzle.colProducts[col]) {
            const colProductCell = document.querySelector(`#puzzle-${puzzleId} .puzzle-table tr:nth-child(${DIMENSIONS + 1}) td:nth-child(${col + 1})`);
            if (colProductCell) {
                colProductCell.classList.add('product-correct');
            }
        }
    }
}

// Toggle cell selection
function toggleCell(puzzleId, row, col) {
    const cell = document.querySelector(`#puzzle-${puzzleId} .puzzle-table tr:nth-child(${row + 1}) td:nth-child(${col + 1})`);
    if (cell && !cell.classList.contains('product-cell') && !cell.classList.contains('corner-cell')) {
        cell.classList.toggle('selected');
        // Update product highlights after selection change
        updateProductHighlights(puzzleId);
    }
}

// Check solution
function checkSolution(puzzleId) {
    const puzzle = puzzleData[puzzleId];
    const selectedCells = document.querySelectorAll(`#puzzle-${puzzleId} .puzzle-table td.selected`);
    const resultDiv = document.getElementById(`result-${puzzleId}`);
    
    // Get selected positions
    const selectedPositions = [];
    selectedCells.forEach(cell => {
        const row = cell.parentElement.rowIndex;
        const col = cell.cellIndex;
        if (row < DIMENSIONS && col < DIMENSIONS) {
            selectedPositions.push([row, col]);
        }
    });

    // Build the correct selection set from row selections
    const correctSelections = [];
    for (let row = 0; row < DIMENSIONS; row++) {
        for (let col of puzzle.rowSelections[row]) {
            correctSelections.push([row, col]);
        }
    }

    // Check if all correct cells are selected and no incorrect ones
    const isCorrect = correctSelections.every(pos => 
        selectedPositions.some(sel => sel[0] === pos[0] && sel[1] === pos[1])
    ) && selectedPositions.every(pos => 
        correctSelections.some(correct => correct[0] === pos[0] && correct[1] === pos[1])
    );

    // Update cell colors
    const allCells = document.querySelectorAll(`#puzzle-${puzzleId} .puzzle-table td`);
    allCells.forEach(cell => {
        cell.classList.remove('correct', 'incorrect');
        if (cell.classList.contains('selected')) {
            const row = cell.parentElement.rowIndex;
            const col = cell.cellIndex;
            if (row < DIMENSIONS && col < DIMENSIONS) {
                const isCorrectCell = correctSelections.some(pos => pos[0] === row && pos[1] === col);
                cell.classList.add(isCorrectCell ? 'correct' : 'incorrect');
            }
        }
    });

    // Show result message
    if (isCorrect) {
        resultDiv.innerHTML = '<div class="result-message result-correct">✓ Correct!</div>';
    } else {
        resultDiv.innerHTML = '<div class="result-message result-incorrect">✗ Try again!</div>';
    }
}

// Show solution
function showSolution(puzzleId) {
    const puzzle = puzzleData[puzzleId];
    const cells = document.querySelectorAll(`#puzzle-${puzzleId} .puzzle-table td`);
    const showBtn = document.querySelector(`#puzzle-${puzzleId} .show-solution-btn`);
    const checkBtn = document.querySelector(`#puzzle-${puzzleId} .check-btn`);
    const resetBtn = document.querySelector(`#puzzle-${puzzleId} .reset-btn`);
    
    // Clear any existing highlights
    cells.forEach(cell => {
        cell.classList.remove('solution-highlight');
    });
    
    // Highlight solution cells
    cells.forEach((cell, index) => {
        const row = Math.floor(index / (DIMENSIONS + 1));
        const col = index % (DIMENSIONS + 1);
        
        if (row < DIMENSIONS && col < DIMENSIONS) {
            const isSolutionCell = puzzle.rowSelections[row].includes(col);
            if (isSolutionCell) {
                cell.classList.add('solution-highlight');
            }
        }
    });
    
    // Update button states
    showBtn.textContent = 'Hide';
    showBtn.onclick = () => hideSolution(puzzleId);
    checkBtn.disabled = true;
    resetBtn.disabled = true;
}

// Hide solution
function hideSolution(puzzleId) {
    const cells = document.querySelectorAll(`#puzzle-${puzzleId} .puzzle-table td`);
    const showBtn = document.querySelector(`#puzzle-${puzzleId} .show-solution-btn`);
    const checkBtn = document.querySelector(`#puzzle-${puzzleId} .check-btn`);
    const resetBtn = document.querySelector(`#puzzle-${puzzleId} .reset-btn`);
    
    // Clear solution highlights
    cells.forEach(cell => {
        cell.classList.remove('solution-highlight');
    });
    
    // Update button states
    showBtn.textContent = 'Show';
    showBtn.onclick = () => showSolution(puzzleId);
    checkBtn.disabled = false;
    resetBtn.disabled = false;
}

// Reset puzzle
function resetPuzzle(puzzleId) {
    const cells = document.querySelectorAll(`#puzzle-${puzzleId} .puzzle-table td`);
    const showBtn = document.querySelector(`#puzzle-${puzzleId} .show-solution-btn`);
    const checkBtn = document.querySelector(`#puzzle-${puzzleId} .check-btn`);
    const resetBtn = document.querySelector(`#puzzle-${puzzleId} .reset-btn`);
    
    cells.forEach(cell => {
        cell.classList.remove('selected', 'correct', 'incorrect', 'solution-highlight', 'product-correct');
    });
    
    // Reset button states
    showBtn.textContent = 'Show';
    showBtn.onclick = () => showSolution(puzzleId);
    checkBtn.disabled = false;
    resetBtn.disabled = false;
    
    const resultDiv = document.getElementById(`result-${puzzleId}`);
    resultDiv.innerHTML = '';
}

// Generate new boards
function generateNewBoards() {
    generateAllPuzzles();
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', function() {
    generateAllPuzzles();
});
