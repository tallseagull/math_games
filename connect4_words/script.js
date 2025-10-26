// Game state
let gameState = {
    words: [],
    currentPlayer: 'yellow',
    board: [],
    rows: 0,
    cols: 0,
    connectN: 0,
    gameOver: false,
    selectedWords: []
};

// Load words from JSON file
async function loadWords() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        gameState.words = data.words;
    } catch (error) {
        console.error('Error loading words:', error);
        gameState.words = ['apple', 'banana', 'cat', 'dog', 'elephant', 'flower', 'guitar', 'house', 'island', 'jungle', 'kite', 'lemon', 'mountain', 'notebook', 'ocean', 'piano', 'queen', 'rainbow', 'sun', 'tree', 'umbrella', 'violin', 'water', 'xylophone', 'yellow', 'zebra'];
    }
}

// Initialize the game
async function init() {
    await loadWords();
    setupModeSelection();
}

// Setup mode selection
function setupModeSelection() {
    const modeButtons = document.querySelectorAll('.mode-button');
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const rows = parseInt(button.dataset.rows);
            const cols = parseInt(button.dataset.cols);
            const connect = parseInt(button.dataset.connect);
            startGame(rows, cols, connect);
        });
    });
}

// Start a new game with specified dimensions
function startGame(rows, cols, connectN) {
    gameState.rows = rows;
    gameState.cols = cols;
    gameState.connectN = connectN;
    gameState.currentPlayer = 'yellow';
    gameState.gameOver = false;
    gameState.board = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    // Select random unique words
    selectRandomWords(rows * cols);
    
    // Hide setup, show game
    document.getElementById('gameSetup').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('gameControls').style.display = 'none';
    document.getElementById('passButton').style.display = 'block';
    
    // Create the game board
    createBoard();
    updatePlayerIndicator();
}

// Select random unique words from the word list
function selectRandomWords(count) {
    const shuffled = [...gameState.words].sort(() => Math.random() - 0.5);
    gameState.selectedWords = shuffled.slice(0, count);
}

// Create the game board
function createBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    // Set grid class based on game mode
    if (gameState.rows === 3 && gameState.cols === 3) {
        gameBoard.className = 'game-board tic-tac-toe';
    } else {
        gameBoard.className = 'game-board connect4';
    }
    
    let wordIndex = 0;
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const word = document.createElement('div');
            word.className = 'cell-word';
            word.textContent = gameState.selectedWords[wordIndex++];
            cell.appendChild(word);
            
            cell.addEventListener('click', () => handleCellClick(row, col, cell));
            gameBoard.appendChild(cell);
        }
    }
}

// Handle cell click
function handleCellClick(row, col, cellElement) {
    if (gameState.gameOver || gameState.board[row][col] !== null) {
        return;
    }
    
    // Fill the cell with current player's color
    gameState.board[row][col] = gameState.currentPlayer;
    fillCell(cellElement, gameState.currentPlayer);
    
    // Check for win
    if (checkWin(row, col)) {
        endGame(gameState.currentPlayer);
    } else {
        // Switch player
        switchPlayer();
    }
}

// Fill a cell with a colored circle
function fillCell(cellElement, color) {
    cellElement.classList.add('filled');
    const circle = document.createElement('div');
    circle.className = `cell-circle ${color}`;
    cellElement.appendChild(circle);
}

// Handle pass button
document.getElementById('passButton').addEventListener('click', () => {
    if (!gameState.gameOver) {
        switchPlayer();
    }
});

// Switch to the other player
function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'yellow' ? 'red' : 'yellow';
    updatePlayerIndicator();
}

// Update the current player indicator
function updatePlayerIndicator() {
    const indicator = document.getElementById('currentPlayerIndicator');
    const color = gameState.currentPlayer;
    const displayName = color.charAt(0).toUpperCase() + color.slice(1);
    indicator.innerHTML = `<span class="player-circle ${color}"></span> ${displayName}`;
}

// Check if the current move results in a win
function checkWin(row, col) {
    const color = gameState.board[row][col];
    const n = gameState.connectN;
    
    // Check horizontal
    const horizontal = checkDirection(row, col, 0, 1, color, n);
    if (horizontal) return horizontal;
    
    // Check vertical
    const vertical = checkDirection(row, col, 1, 0, color, n);
    if (vertical) return vertical;
    
    // Check diagonal (top-left to bottom-right)
    const diagonal1 = checkDirection(row, col, 1, 1, color, n);
    if (diagonal1) return diagonal1;
    
    // Check diagonal (top-right to bottom-left)
    const diagonal2 = checkDirection(row, col, 1, -1, color, n);
    if (diagonal2) return diagonal2;
    
    return null;
}

// Check a specific direction for a win
function checkDirection(row, col, rowDir, colDir, color, n) {
    const positions = [{row, col}];
    
    // Check in positive direction
    let r = row + rowDir;
    let c = col + colDir;
    while (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols && 
           gameState.board[r][c] === color) {
        positions.push({row: r, col: c});
        r += rowDir;
        c += colDir;
    }
    
    // Check in negative direction
    r = row - rowDir;
    c = col - colDir;
    while (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols && 
           gameState.board[r][c] === color) {
        positions.push({row: r, col: c});
        r -= rowDir;
        c -= colDir;
    }
    
    if (positions.length >= n) {
        return positions;
    }
    
    return null;
}

// End the game and show winner
function endGame(winner) {
    gameState.gameOver = true;
    
    // Highlight winning positions
    const winningPositions = findAllWinningPositions(winner);
    if (winningPositions.length > 0) {
        highlightWinningCells(winningPositions);
    }
    
    // Hide pass button and show winner message and controls
    document.getElementById('passButton').style.display = 'none';
    
    const winnerMessage = document.getElementById('winnerMessage');
    const displayName = winner.charAt(0).toUpperCase() + winner.slice(1);
    winnerMessage.innerHTML = `<span class="player-circle ${winner}"></span> ${displayName} Wins!`;
    
    document.getElementById('gameControls').style.display = 'flex';
}

// Find all winning positions for the winner
function findAllWinningPositions(color) {
    const winningCells = new Set();
    
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col] === color) {
                // Check all directions from this cell
                const directions = [
                    {rowDir: 0, colDir: 1},  // horizontal
                    {rowDir: 1, colDir: 0},  // vertical
                    {rowDir: 1, colDir: 1},  // diagonal \
                    {rowDir: 1, colDir: -1}  // diagonal /
                ];
                
                for (const {rowDir, colDir} of directions) {
                    const positions = checkDirection(row, col, rowDir, colDir, color, gameState.connectN);
                    if (positions) {
                        positions.forEach(pos => {
                            winningCells.add(`${pos.row},${pos.col}`);
                        });
                    }
                }
            }
        }
    }
    
    return Array.from(winningCells).map(key => {
        const [row, col] = key.split(',').map(Number);
        return {row, col};
    });
}

// Highlight winning cells
function highlightWinningCells(positions) {
    positions.forEach(pos => {
        const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            cell.classList.add('winning');
        }
    });
}

// New game button
document.getElementById('newGameButton').addEventListener('click', () => {
    startGame(gameState.rows, gameState.cols, gameState.connectN);
});

// Change mode button
document.getElementById('changeModeButton').addEventListener('click', () => {
    document.getElementById('gameSetup').style.display = 'block';
    document.getElementById('gameContainer').style.display = 'none';
});

// Initialize the game when page loads
init();

