// Game state
let gameState = {
    wordLists: {},
    imageCategories: {},
    selectedListKey: null,
    words: [],
    currentPlayer: 'yellow',
    board: [],
    rows: 0,
    cols: 0,
    connectN: 0,
    gameOver: false,
    selectedWords: [],
    isImageMode: false
};

// Load word lists from JSON file
async function loadWordLists() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        gameState.wordLists = data.wordLists || {};
        
        // Load images.json for image mode support
        try {
            const imagesResponse = await fetch('images.json');
            const imagesData = await imagesResponse.json();
            gameState.imageCategories = imagesData || {};
        } catch (error) {
            console.error('Error loading images:', error);
            gameState.imageCategories = {};
        }
        
        populateWordListSelector();
    } catch (error) {
        console.error('Error loading word lists:', error);
        // Fallback to default word list
        gameState.wordLists = {
            'default': {
                name: 'Default',
                description: 'Default word list',
                words: ['apple', 'banana', 'cat', 'dog', 'elephant', 'flower', 'guitar', 'house', 'island', 'jungle', 'kite', 'lemon', 'mountain', 'notebook', 'ocean', 'piano', 'queen', 'rainbow', 'sun', 'tree', 'umbrella', 'violin', 'water', 'xylophone', 'yellow', 'zebra']
            }
        };
        populateWordListSelector();
    }
}

// Populate the word list selector
function populateWordListSelector() {
    const selector = document.getElementById('wordListSelector');
    selector.innerHTML = '';
    
    const listKeys = Object.keys(gameState.wordLists);
    
    if (listKeys.length === 0) {
        selector.innerHTML = '<p>No word lists available</p>';
        return;
    }
    
    // Check URL parameter first (for Golda integration)
    const urlParams = new URLSearchParams(window.location.search);
    const gradeParam = urlParams.get('grade');
    const listKeyParam = urlParams.get('listKey');
    
    if (listKeyParam && gameState.wordLists[listKeyParam]) {
        selectWordList(listKeyParam);
        return;
    }
    
    if (gradeParam) {
        // Map grade parameter to word list key
        const gradeMap = {
            '4th': '4th_grade',
            '5th': '5th_grade'
        };
        const listKey = gradeMap[gradeParam];
        if (listKey && gameState.wordLists[listKey]) {
            selectWordList(listKey);
            return;
        }
    }
    
    listKeys.forEach(key => {
        const list = gameState.wordLists[key];
        const button = document.createElement('button');
        button.className = 'word-list-button';
        button.dataset.listKey = key;
        
        const name = document.createElement('div');
        name.className = 'word-list-name';
        name.textContent = list.name;
        
        const desc = document.createElement('div');
        desc.className = 'word-list-desc';
        desc.textContent = list.description;
        
        button.appendChild(name);
        button.appendChild(desc);
        
        button.addEventListener('click', () => selectWordList(key));
        selector.appendChild(button);
    });
}

// Handle word list selection
async function selectWordList(listKey) {
    gameState.selectedListKey = listKey;
    const list = gameState.wordLists[listKey];
    
    // Check if this is image mode
    if (list.isImageMode && list.category) {
        gameState.isImageMode = true;
        // Load words from image category
        if (gameState.imageCategories[list.category]) {
            gameState.words = gameState.imageCategories[list.category];
        } else {
            console.error('Image category not found:', list.category);
            return;
        }
    } else {
        gameState.isImageMode = false;
        gameState.words = list.words || [];
    }
    
    // Hide word list selector, show game mode selection
    document.getElementById('wordListSelector').style.display = 'none';
    document.querySelector('#gameSetup h2').textContent = 'Choose Game Mode';
    document.getElementById('gameModeTitle').style.display = 'none';
    document.getElementById('modeButtons').style.display = 'flex';
}

// Initialize the game
async function init() {
    await loadWordLists();
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
    
    // Hide winner message overlay
    const winnerMessage = document.getElementById('winnerMessage');
    winnerMessage.classList.remove('show');
    winnerMessage.innerHTML = '';
    
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
    
    // Add image mode class if applicable
    if (gameState.isImageMode) {
        gameBoard.classList.add('image-mode');
    }
    
    let wordIndex = 0;
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const word = gameState.selectedWords[wordIndex++];
            
            if (gameState.isImageMode) {
                // Create image element
                const imageContainer = document.createElement('div');
                imageContainer.className = 'cell-image-container';
                const img = document.createElement('img');
                img.className = 'cell-image';
                
                // Replace spaces with underscores in image filename
                const imageName = word.replace(/ /g, '_');
                
                img.src = `../shared/static/images/${imageName}.jpg`;
                img.alt = word;
                img.onerror = function() {
                    // Fallback if image doesn't exist - show word instead
                    this.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'cell-word';
                    fallback.textContent = word;
                    imageContainer.appendChild(fallback);
                };
                imageContainer.appendChild(img);
                cell.appendChild(imageContainer);
            } else {
                // Create word element
                const wordElement = document.createElement('div');
                wordElement.className = 'cell-word';
                wordElement.textContent = word;
                cell.appendChild(wordElement);
            }
            
            cell.addEventListener('click', () => handleCellClick(row, col, cell));
            gameBoard.appendChild(cell);
        }
    }
}

// Check if a move is valid in Connect4 mode
function isValidConnect4Move(row, col) {
    // In Connect4, you can only place in:
    // 1. The bottom row (row === rows - 1), OR
    // 2. A cell that has a filled cell directly below it
    if (row === gameState.rows - 1) {
        return true; // Bottom row is always valid
    }
    
    // Check if the cell below is filled
    return gameState.board[row + 1][col] !== null;
}

// Handle cell click
function handleCellClick(row, col, cellElement) {
    if (gameState.gameOver || gameState.board[row][col] !== null) {
        return;
    }
    
    // For Connect4 mode, validate the move
    const isConnect4 = gameState.rows === 6 && gameState.cols === 7 && gameState.connectN === 4;
    if (isConnect4 && !isValidConnect4Move(row, col)) {
        // Show visual feedback for invalid move
        showInvalidMoveFeedback(cellElement);
        return;
    }
    
    // Fill the cell with current player's color
    gameState.board[row][col] = gameState.currentPlayer;
    fillCell(cellElement, gameState.currentPlayer);
    
    // Check for win
    if (checkWin(row, col)) {
        endGame(gameState.currentPlayer);
    } else if (isBoardFull()) {
        // Board is full and no winner - it's a draw
        endGame(null);
    } else {
        // Switch player
        switchPlayer();
    }
}

// Show visual feedback for invalid move
function showInvalidMoveFeedback(cellElement) {
    cellElement.classList.add('invalid-move');
    setTimeout(() => {
        cellElement.classList.remove('invalid-move');
    }, 500);
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

// Check if the board is full
function isBoardFull() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col] === null) {
                return false;
            }
        }
    }
    return true;
}

// End the game and show winner
function endGame(winner) {
    gameState.gameOver = true;
    
    // Hide pass button and show message and controls
    document.getElementById('passButton').style.display = 'none';
    
    const winnerMessage = document.getElementById('winnerMessage');
    
    if (winner === null) {
        // It's a draw
        winnerMessage.innerHTML = `It's a Draw!`;
    } else {
        // Highlight winning positions
        const winningPositions = findAllWinningPositions(winner);
        if (winningPositions.length > 0) {
            highlightWinningCells(winningPositions);
        }
        
        const displayName = winner.charAt(0).toUpperCase() + winner.slice(1);
        winnerMessage.innerHTML = `<span class="player-circle ${winner}"></span> ${displayName} Wins!`;
    }
    
    // Show the winner message overlay
    winnerMessage.classList.add('show');
    
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
    // Reset to word list selection
    document.getElementById('wordListSelector').style.display = 'grid';
    document.querySelector('#gameSetup h2').textContent = 'Choose Word List';
    document.getElementById('gameModeTitle').style.display = 'none';
    document.getElementById('modeButtons').style.display = 'none';
    document.getElementById('gameSetup').style.display = 'block';
    document.getElementById('gameContainer').style.display = 'none';
});

// Initialize the game when page loads
init();

