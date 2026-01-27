// Game state
let gameState = {
    currentTeam: 'teamA',
    teamPositions: {
        teamA: 0,
        teamB: 0
    },
    snakes: [],
    ladders: [],
    vocabularyImages: [],
    vocabularyWords: [],
    useWords: false, // true for 4th grade words, false for images
    gameOver: false,
    diceValue: 0,
    diceBox: null,
    isRolling: false
};

// Board configuration
const BOARD_ROWS = 6;
const BOARD_COLS = 10;
const TOTAL_TILES = 60;

// DOM elements
let gameBoard, diceContainer, sidebarDiceContainer, challengeModal, challengeImage;
let challengeImageContainer, challengeWordContainer, challengeWord;
let rollDiceBtn, correctBtn, incorrectBtn, newGameBtn, playAgainBtn;
let currentTurnEl, turnIndicator, teamAPositionEl, teamBPositionEl, teamAInfo, teamBInfo;
let winnerOverlay, winnerText, unitSelection;

// Set back link based on URL parameters
function setupBackLink() {
    const backLink = document.getElementById('backLink');
    if (backLink) {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const grade = urlParams.get('grade');
        const unit = urlParams.get('unit');
        const listKey = urlParams.get('listKey');
        
        if (category || grade || unit || listKey) {
            // Came from grade selection, go back to golda
            backLink.href = '../golda/index.html';
        } else {
            // Came from main menu
            backLink.href = '../index.html';
        }
    }
}

// Initialize game
async function init() {
    // Set up back link
    setupBackLink();
    
    // Get DOM elements
    gameBoard = document.getElementById('gameBoard');
    diceContainer = document.getElementById('diceContainer');
    sidebarDiceContainer = document.getElementById('sidebarDiceContainer');
    challengeModal = document.getElementById('challengeModal');
    challengeImage = document.getElementById('challengeImage');
    challengeImageContainer = document.getElementById('challengeImageContainer');
    challengeWordContainer = document.getElementById('challengeWordContainer');
    challengeWord = document.getElementById('challengeWord');
    rollDiceBtn = document.getElementById('rollDiceBtn');
    correctBtn = document.getElementById('correctBtn');
    incorrectBtn = document.getElementById('incorrectBtn');
    newGameBtn = document.getElementById('newGameBtn');
    playAgainBtn = document.getElementById('playAgainBtn');
    currentTurnEl = document.getElementById('currentTurn');
    turnIndicator = document.querySelector('.turn-indicator');
    teamAPositionEl = document.getElementById('teamAPosition');
    teamBPositionEl = document.getElementById('teamBPosition');
    teamAInfo = document.getElementById('teamAInfo');
    teamBInfo = document.getElementById('teamBInfo');
    winnerOverlay = document.getElementById('winnerOverlay');
    winnerText = document.getElementById('winnerText');
    unitSelection = document.getElementById('unitSelection');

    // Check if 4th grade with unit parameter
    const urlParams = new URLSearchParams(window.location.search);
    const unit = urlParams.get('unit');
    const grade = urlParams.get('grade');
    
    if (grade === '4th' || unit) {
        // Show unit selection
        if (unitSelection) {
            unitSelection.classList.remove('hidden');
            setupUnitSelection();
            return; // Don't load game until unit is selected
        }
    } else {
        // Load vocabulary images (3rd grade mode)
        await loadVocabularyImages();
    }
    
    console.log('Game initialization complete. Grade:', grade, 'Unit:', unit);
}

// Setup unit selection
function setupUnitSelection() {
    const unitButtons = unitSelection.querySelectorAll('.unit-button');
    unitButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const unitNum = e.target.getAttribute('data-unit');
            unitSelection.classList.add('hidden');
            await loadUnitWords(unitNum);
        });
    });
}

// Load vocabulary words from words.json for 4th grade
async function loadUnitWords(unitNum) {
    try {
        const response = await fetch('../connect4_words/words.json');
        const data = await response.json();
        
        const unitKey = `4th_grade_unit${unitNum}`;
        if (data.wordLists && data.wordLists[unitKey] && data.wordLists[unitKey].words) {
            const words = data.wordLists[unitKey].words;
            // Filter out phrases, keep only single words
            gameState.vocabularyWords = words.filter(word => {
                return word && !word.includes(' ') && !word.includes('?') && !word.includes('…') && !word.includes('.');
            });
            gameState.useWords = true;
        } else {
            // Fallback to images
            await loadVocabularyImages();
        }
    } catch (error) {
        console.error('Error loading unit words:', error);
        // Fallback to images
        await loadVocabularyImages();
    }
    
    // Continue game initialization
    await continueGameInit();
}

// Continue game initialization after unit/words are loaded
async function continueGameInit() {
    // Initialize dice box
    await initDiceBox();

    // Set up event listeners
    rollDiceBtn.addEventListener('click', handleRollDice);
    correctBtn.addEventListener('click', () => handleChallengeAnswer(true));
    incorrectBtn.addEventListener('click', () => handleChallengeAnswer(false));
    newGameBtn.addEventListener('click', startNewGame);
    playAgainBtn.addEventListener('click', startNewGame);

    // Redraw snakes and ladders on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (gameState.snakes.length > 0 || gameState.ladders.length > 0) {
                drawSnakesAndLadders();
            }
        }, 250);
    });

    // Start the game
    startNewGame();
}

// Load vocabulary images from JSON
async function loadVocabularyImages() {
    try {
        const response = await fetch('images.json');
        const data = await response.json();
        gameState.vocabularyImages = data.images || [];
        gameState.useWords = false;
    } catch (error) {
        console.error('Error loading vocabulary images:', error);
        // Fallback to placeholder images
        gameState.vocabularyImages = Array.from({ length: 60 }, (_, i) => ({
            word: `word${i + 1}`,
            url: `../shared/static/images/apple.jpg`
        }));
        gameState.useWords = false;
    }
    
    // Continue game initialization
    await continueGameInit();
}

// Initialize CSS-based 3D dice with dots
function initDiceBox() {
    try {
        const sidebarDiceContainer = document.getElementById('sidebarDiceContainer');
        if (!sidebarDiceContainer) {
            console.warn('Dice container not found');
            return;
        }

        // Clear container
        sidebarDiceContainer.innerHTML = '';

        // Create dice element
        const dieElement = document.createElement('div');
        dieElement.className = 'dice';
        dieElement.id = 'gameDice';
        
        // Create 6 faces with dots
        const pipConfigs = {
            1: [[0, 0]], // Center
            2: [[-1, -1], [1, 1]], // Diagonal
            3: [[-1, -1], [0, 0], [1, 1]], // Diagonal
            4: [[-1, -1], [-1, 1], [1, -1], [1, 1]], // Corners
            5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]], // Corners + center
            6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] // Two columns
        };

        for (let face = 1; face <= 6; face++) {
            const faceElement = document.createElement('div');
            faceElement.className = `face face-${face}`;
            
            // Add dots (pips) to this face
            const pips = pipConfigs[face];
            pips.forEach(([x, y]) => {
                const pip = document.createElement('div');
                pip.className = 'pip';
                pip.style.setProperty('--pip-x', x);
                pip.style.setProperty('--pip-y', y);
                faceElement.appendChild(pip);
            });
            
            dieElement.appendChild(faceElement);
        }
        
        sidebarDiceContainer.appendChild(dieElement);

        // Helper function to get face rotation
        const getFaceRotation = (face) => {
            const rotations = {
                1: { x: 0, y: 0, z: 0 },       // Face 1 (Front) - no rotation needed
                2: { x: 0, y: -90, z: 0 },     // Face 2 (Right) - rotate left to show right face
                3: { x: 90, y: 0, z: 0 },      // Face 3 (Top) - rotate down to show top face
                4: { x: -90, y: 0, z: 0 },     // Face 4 (Bottom) - rotate up to show bottom face
                5: { x: 0, y: 90, z: 0 },      // Face 5 (Left) - rotate right to show left face
                6: { x: 0, y: 180, z: 0 }      // Face 6 (Back) - rotate 180 to show back face
            };
            return rotations[face] || rotations[1];
        };

        // Store dice state
        gameState.diceBox = {
            dieElement: dieElement,
            isRolling: false,
            currentValue: 1,
            roll: async function() {
                if (this.isRolling) return;
                
                this.isRolling = true;
                const targetValue = Math.floor(Math.random() * 6) + 1;
                
                // Calculate the final rotation needed to show the selected face
                const finalRotations = getFaceRotation(targetValue);
                
                // Add some extra random rotations to make it look more natural
                const extraRotations = 2 + Math.floor(Math.random() * 3); // 2-4 extra full rotations
                const finalX = finalRotations.x + (extraRotations * 360);
                const finalY = finalRotations.y + (extraRotations * 360);
                const finalZ = finalRotations.z + (extraRotations * 360);
                
                // Add rolling animation
                dieElement.classList.add('rolling');
                
                // Set final rotation values that will show the correct face
                dieElement.style.setProperty('--roll-x', `${finalX}deg`);
                dieElement.style.setProperty('--roll-y', `${finalY}deg`);
                dieElement.style.setProperty('--roll-z', `${finalZ}deg`);
                
                // Wait for animation to complete (1.5 seconds)
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Remove rolling class and explicitly set the final transform
                dieElement.classList.remove('rolling');
                
                // Explicitly set the final transform to lock the dice in position
                dieElement.style.transform = `rotateX(${finalRotations.x}deg) rotateY(${finalRotations.y}deg) rotateZ(${finalRotations.z}deg)`;
                dieElement.style.transition = 'none'; // Disable any transitions
                
                this.isRolling = false;
                this.currentValue = targetValue;
                
                return [{ value: targetValue }];
            },
            setDiceValue: function(value) {
                const finalRotations = getFaceRotation(value);
                dieElement.style.transform = `rotateX(${finalRotations.x}deg) rotateY(${finalRotations.y}deg) rotateZ(${finalRotations.z}deg)`;
                dieElement.style.transition = 'none';
                this.currentValue = value;
            }
        };

        // Set initial value
        gameState.diceBox.setDiceValue(1);

        console.log('3D dice initialized successfully');
    } catch (error) {
        console.warn('Error initializing 3D dice:', error);
        gameState.diceBox = null;
    }
}

// Start a new game
function startNewGame() {
    gameState.currentTeam = 'teamA';
    gameState.teamPositions = { teamA: 1, teamB: 1 };
    gameState.gameOver = false;
    gameState.diceValue = 0;
    gameState.isRolling = false;

    // Generate snakes and ladders
    generateSnakesAndLadders();

    // Render board
    renderBoard();

    // Update UI
    updateSidebar();
    hideWinnerOverlay();
    enableRollButton();
}

// Helper function to get row and column from tile number
// Board starts at bottom (row 5 = bottom, row 0 = top)
function getTileRowCol(tileNumber) {
    const logicalRow = Math.floor((tileNumber - 1) / BOARD_COLS);
    const visualRow = BOARD_ROWS - 1 - logicalRow; // Reverse: bottom row (5) = logical row 0
    const col = (logicalRow % 2 === 0) 
        ? (tileNumber - 1) % BOARD_COLS
        : BOARD_COLS - 1 - ((tileNumber - 1) % BOARD_COLS);
    return { row: visualRow, col };
}

// Helper function to get tile number from row and column
// Board starts at bottom (row 5 = bottom, row 0 = top)
function getTileNumber(row, col) {
    const logicalRow = BOARD_ROWS - 1 - row; // Reverse: visual row 5 = logical row 0
    if (logicalRow % 2 === 0) {
        // Left to right
        return logicalRow * BOARD_COLS + col + 1;
    } else {
        // Right to left
        return (logicalRow + 1) * BOARD_COLS - col;
    }
}

// Generate snakes and ladders (ladders go up to higher numbers, snakes go down to lower numbers)
function generateSnakesAndLadders() {
    gameState.snakes = [];
    gameState.ladders = [];
    
    const usedTiles = new Set();
    const numSnakes = 6;
    const numLadders = 6;

    // Pre-generate all valid pairs to ensure we can find enough
    // Constraint: snakes and ladders must go exactly one row up/down in the same column
    // With zigzag pattern: one row DOWN visually = ladders (tile number increases)
    //                      one row UP visually = snakes (tile number decreases)
    const allLadderPairs = [];
    const allSnakePairs = [];
    
    // Find all valid ladder pairs
    // With reversed board: visual row 5 (bottom) = tiles 1-10, visual row 0 (top) = tiles 51-60
    // Ladders go UP visually (row N+1 -> row N) to increase tile numbers
    // Example: row 5 -> row 4 means tiles 1-10 -> tiles 11-20 (ladder up)
    for (let startRow = 1; startRow < BOARD_ROWS; startRow++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const start = getTileNumber(startRow, col);
            const endRow = startRow - 1; // One row up visually (toward top)
            const end = getTileNumber(endRow, col);
            
            // Ladder must go up in tile numbers (end > start)
            // Cannot end on tile 60 (last square)
            // Cannot start on tile 1 (starting position)
            if (end > start && end < TOTAL_TILES && start > 1) {
                allLadderPairs.push({ start, end, row: startRow });
            }
        }
    }
    
    // Find all valid snake pairs
    // Snakes go DOWN visually (row N -> row N+1) to decrease tile numbers
    // Example: row 0 -> row 1 means tiles 51-60 -> tiles 41-50 (snake down)
    for (let startRow = 0; startRow < BOARD_ROWS - 1; startRow++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const start = getTileNumber(startRow, col);
            const endRow = startRow + 1; // One row down visually (toward bottom)
            const end = getTileNumber(endRow, col);
            
            // Snake must go down in tile numbers (end < start)
            // Cannot start on tile 60 (last square)
            if (end < start && end >= 1 && start < TOTAL_TILES) {
                allSnakePairs.push({ start, end, row: startRow });
            }
        }
    }
    
    // Helper function to check if two tiles are adjacent (horizontally, vertically, or diagonally)
    const areAdjacent = (tile1, tile2) => {
        const pos1 = getTileRowCol(tile1);
        const pos2 = getTileRowCol(tile2);
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        // Adjacent if they're next to each other horizontally, vertically, or diagonally
        return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0;
    };
    
    // Helper function to check if a tile conflicts with existing pairs
    const hasConflict = (tile, existingPairs) => {
        for (const pair of existingPairs) {
            if (areAdjacent(tile, pair.start) || areAdjacent(tile, pair.end)) {
                return true;
            }
        }
        return false;
    };
    
    // Select ladders with spacing constraints (max 2 per row, try to avoid adjacent)
    const maxPerRow = 2;
    const rowCounts = new Array(BOARD_ROWS).fill(0);
    const shuffledLadders = [...allLadderPairs].sort(() => Math.random() - 0.5);
    
    // First pass: try to get well-spaced ladders
    for (const pair of shuffledLadders) {
        if (gameState.ladders.length >= numLadders) break;
        
        // Check row limit
        if (rowCounts[pair.row] >= maxPerRow) continue;
        
        // Check if tiles are already used
        if (usedTiles.has(pair.start) || usedTiles.has(pair.end)) continue;
        
        // Check if conflicts with existing ladders (prefer non-adjacent)
        if (hasConflict(pair.start, gameState.ladders) || hasConflict(pair.end, gameState.ladders)) continue;
        
        // Check if conflicts with existing snakes (prefer non-adjacent)
        if (hasConflict(pair.start, gameState.snakes) || hasConflict(pair.end, gameState.snakes)) continue;
        
        gameState.ladders.push(pair);
        usedTiles.add(pair.start);
        usedTiles.add(pair.end);
        rowCounts[pair.row]++;
    }
    
    // Second pass: if we don't have enough, relax adjacency constraint
    if (gameState.ladders.length < numLadders) {
        for (const pair of shuffledLadders) {
            if (gameState.ladders.length >= numLadders) break;
            
            // Skip if already added
            if (gameState.ladders.find(l => l.start === pair.start && l.end === pair.end)) continue;
            
            // Check row limit
            if (rowCounts[pair.row] >= maxPerRow) continue;
            
            // Check if tiles are already used
            if (usedTiles.has(pair.start) || usedTiles.has(pair.end)) continue;
            
            gameState.ladders.push(pair);
            usedTiles.add(pair.start);
            usedTiles.add(pair.end);
            rowCounts[pair.row]++;
        }
    }
    
    // Select snakes with spacing constraints (max 2 per row, try to avoid adjacent)
    const snakeRowCounts = new Array(BOARD_ROWS).fill(0);
    const shuffledSnakes = [...allSnakePairs].sort(() => Math.random() - 0.5);
    
    // First pass: try to get well-spaced snakes
    for (const pair of shuffledSnakes) {
        if (gameState.snakes.length >= numSnakes) break;
        
        // Check row limit
        if (snakeRowCounts[pair.row] >= maxPerRow) continue;
        
        // Check if tiles are already used
        if (usedTiles.has(pair.start) || usedTiles.has(pair.end)) continue;
        
        // Check if conflicts with existing snakes (prefer non-adjacent)
        if (hasConflict(pair.start, gameState.snakes) || hasConflict(pair.end, gameState.snakes)) continue;
        
        // Check if conflicts with existing ladders (prefer non-adjacent)
        if (hasConflict(pair.start, gameState.ladders) || hasConflict(pair.end, gameState.ladders)) continue;
        
        gameState.snakes.push(pair);
        usedTiles.add(pair.start);
        usedTiles.add(pair.end);
        snakeRowCounts[pair.row]++;
    }
    
    // Second pass: if we don't have enough, relax adjacency constraint
    if (gameState.snakes.length < numSnakes) {
        for (const pair of shuffledSnakes) {
            if (gameState.snakes.length >= numSnakes) break;
            
            // Skip if already added
            if (gameState.snakes.find(s => s.start === pair.start && s.end === pair.end)) continue;
            
            // Check row limit
            if (snakeRowCounts[pair.row] >= maxPerRow) continue;
            
            // Check if tiles are already used
            if (usedTiles.has(pair.start) || usedTiles.has(pair.end)) continue;
            
            gameState.snakes.push(pair);
            usedTiles.add(pair.start);
            usedTiles.add(pair.end);
            snakeRowCounts[pair.row]++;
        }
    }
    
    console.log(`Generated ${gameState.snakes.length} snakes and ${gameState.ladders.length} ladders`);
    if (gameState.snakes.length < numSnakes || gameState.ladders.length < numLadders) {
        console.warn(`Warning: Could not generate all snakes/ladders. Snakes: ${gameState.snakes.length}/${numSnakes}, Ladders: ${gameState.ladders.length}/${numLadders}`);
    }
}

// Render the game board
function renderBoard() {
    gameBoard.innerHTML = '';

    // Create board grid - fill available space
    gameBoard.style.display = 'grid';
    gameBoard.style.gridTemplateColumns = `repeat(${BOARD_COLS}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${BOARD_ROWS}, 1fr)`;
    gameBoard.style.gap = '4px';
    gameBoard.style.width = '100%';
    gameBoard.style.height = '100%';
    gameBoard.style.maxWidth = '100%';
    gameBoard.style.maxHeight = '100%';

    // Create tiles in snake pattern (starting from bottom)
    // Row 5 (bottom) = tiles 1-10, Row 0 (top) = tiles 51-60
    const tiles = [];
    for (let visualRow = 0; visualRow < BOARD_ROWS; visualRow++) {
        const rowTiles = [];
        const logicalRow = BOARD_ROWS - 1 - visualRow; // Reverse: visual row 5 = logical row 0
        for (let col = 0; col < BOARD_COLS; col++) {
            const tileNum = logicalRow % 2 === 0 
                ? logicalRow * BOARD_COLS + col + 1
                : (logicalRow + 1) * BOARD_COLS - col;
            rowTiles.push(tileNum);
        }
        tiles.push(rowTiles);
    }

    // Create tile elements
    tiles.forEach((row, rowIdx) => {
        row.forEach((tileNum, colIdx) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.tileNumber = tileNum;
            
            // Add tile number
            const numberEl = document.createElement('div');
            numberEl.className = 'tile-number';
            numberEl.textContent = tileNum;
            tile.appendChild(numberEl);

            // Check for snake (icon at start/top)
            const snake = gameState.snakes.find(s => s.start === tileNum);
            if (snake) {
                tile.classList.add('snake-head');
            }

            // Check for ladder (icon at start/bottom)
            const ladder = gameState.ladders.find(l => l.start === tileNum);
            if (ladder) {
                tile.classList.add('ladder-bottom');
            }

            // Add trophy icon to tile 60
            if (tileNum === TOTAL_TILES) {
                tile.classList.add('trophy-tile');
            }

            // Add pawn containers
            const pawnContainer = document.createElement('div');
            pawnContainer.className = 'pawn-container';
            tile.appendChild(pawnContainer);

            gameBoard.appendChild(tile);
        });
    });

    // Update pawn positions
    updatePawnPositions();

    // Draw snake and ladder lines after tiles are rendered and positioned
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            drawSnakesAndLadders();
        });
    });
}

// Helper function to get tile position in grid
function getTilePosition(tileNumber) {
    const row = Math.floor((tileNumber - 1) / BOARD_COLS);
    const col = (row % 2 === 0) 
        ? (tileNumber - 1) % BOARD_COLS
        : BOARD_COLS - 1 - ((tileNumber - 1) % BOARD_COLS);
    return { row, col };
}

// Draw thick arrows for snakes and ladders
function drawSnakesAndLadders() {
    // Remove existing overlay if any
    const existingOverlay = gameBoard.querySelector('.snakes-ladders-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Wait a bit to ensure board is fully rendered
    setTimeout(() => {
        const boardRect = gameBoard.getBoundingClientRect();
        const boardWidth = boardRect.width;
        const boardHeight = boardRect.height;

        if (boardWidth === 0 || boardHeight === 0) {
            console.warn('Board dimensions are zero, retrying...');
            setTimeout(drawSnakesAndLadders, 100);
            return;
        }

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'snakes-ladders-overlay');
        svg.setAttribute('viewBox', `0 0 ${boardWidth} ${boardHeight}`);
        svg.setAttribute('width', boardWidth);
        svg.setAttribute('height', boardHeight);
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '2';
        svg.style.overflow = 'visible';

        // Helper function to draw arrow (for snakes)
        const drawArrow = (startX, startY, endX, endY, color, strokeWidth) => {
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Make arrowhead more visible and proportional
            const arrowLength = Math.max(12, distance * 0.1);
            const arrowWidth = Math.max(10, distance * 0.08);
            
            // Shorten the line slightly to make room for arrowhead
            const lineEndX = endX - arrowLength * 0.7 * Math.cos(angle);
            const lineEndY = endY - arrowLength * 0.7 * Math.sin(angle);

            // Draw main line (more visible)
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', startX);
            line.setAttribute('y1', startY);
            line.setAttribute('x2', lineEndX);
            line.setAttribute('y2', lineEndY);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', strokeWidth);
            line.setAttribute('stroke-opacity', '0.9');
            line.setAttribute('stroke-linecap', 'round');
            svg.appendChild(line);

            // Draw arrowhead (more visible)
            const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const arrowTipX = endX;
            const arrowTipY = endY;
            const arrowBaseX = endX - arrowLength * Math.cos(angle);
            const arrowBaseY = endY - arrowLength * Math.sin(angle);
            
            // Calculate arrowhead points
            const arrowLeftX = arrowBaseX - arrowWidth * Math.cos(angle - Math.PI / 2);
            const arrowLeftY = arrowBaseY - arrowWidth * Math.sin(angle - Math.PI / 2);
            const arrowRightX = arrowBaseX - arrowWidth * Math.cos(angle + Math.PI / 2);
            const arrowRightY = arrowBaseY - arrowWidth * Math.sin(angle + Math.PI / 2);
            
            arrowhead.setAttribute('d', `M ${arrowTipX} ${arrowTipY} L ${arrowLeftX} ${arrowLeftY} L ${arrowRightX} ${arrowRightY} Z`);
            arrowhead.setAttribute('fill', color);
            arrowhead.setAttribute('fill-opacity', '0.9');
            arrowhead.setAttribute('stroke', color);
            arrowhead.setAttribute('stroke-width', '2');
            arrowhead.setAttribute('stroke-opacity', '1');
            svg.appendChild(arrowhead);
        };

        // Helper function to draw a realistic ladder
        const drawLadder = (startX, startY, endX, endY, color) => {
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Ladder width (distance between the two side rails)
            const ladderWidth = 20;
            
            // Calculate perpendicular direction for ladder width
            const perpAngle = angle + Math.PI / 2;
            const offsetX = (ladderWidth / 2) * Math.cos(perpAngle);
            const offsetY = (ladderWidth / 2) * Math.sin(perpAngle);
            
            // Calculate the four corners of the ladder
            const leftStartX = startX - offsetX;
            const leftStartY = startY - offsetY;
            const rightStartX = startX + offsetX;
            const rightStartY = startY + offsetY;
            const leftEndX = endX - offsetX;
            const leftEndY = endY - offsetY;
            const rightEndX = endX + offsetX;
            const rightEndY = endY + offsetY;
            
            // Draw left side rail (thicker, more visible)
            const leftRail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            leftRail.setAttribute('x1', leftStartX);
            leftRail.setAttribute('y1', leftStartY);
            leftRail.setAttribute('x2', leftEndX);
            leftRail.setAttribute('y2', leftEndY);
            leftRail.setAttribute('stroke', '#6b4423'); // Darker brown for wood
            leftRail.setAttribute('stroke-width', '5');
            leftRail.setAttribute('stroke-opacity', '1');
            leftRail.setAttribute('stroke-linecap', 'round');
            leftRail.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(leftRail);
            
            // Draw right side rail (thicker, more visible)
            const rightRail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            rightRail.setAttribute('x1', rightStartX);
            rightRail.setAttribute('y1', rightStartY);
            rightRail.setAttribute('x2', rightEndX);
            rightRail.setAttribute('y2', rightEndY);
            rightRail.setAttribute('stroke', '#6b4423'); // Darker brown for wood
            rightRail.setAttribute('stroke-width', '5');
            rightRail.setAttribute('stroke-opacity', '1');
            rightRail.setAttribute('stroke-linecap', 'round');
            rightRail.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(rightRail);
            
            // Draw horizontal rungs (spaced evenly along the ladder)
            const numRungs = Math.max(5, Math.floor(distance / 20)); // At least 5 rungs, more for longer ladders
            for (let i = 1; i < numRungs; i++) {
                const t = i / numRungs;
                const rungX1 = leftStartX + (leftEndX - leftStartX) * t;
                const rungY1 = leftStartY + (leftEndY - leftStartY) * t;
                const rungX2 = rightStartX + (rightEndX - rightStartX) * t;
                const rungY2 = rightStartY + (rightEndY - rightStartY) * t;
                
                const rung = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                rung.setAttribute('x1', rungX1);
                rung.setAttribute('y1', rungY1);
                rung.setAttribute('x2', rungX2);
                rung.setAttribute('y2', rungY2);
                rung.setAttribute('stroke', '#8b5a2b'); // Medium brown for rungs
                rung.setAttribute('stroke-width', '3');
                rung.setAttribute('stroke-opacity', '1');
                rung.setAttribute('stroke-linecap', 'round');
                svg.appendChild(rung);
            }
        };

        // Helper function to draw a curved snake
        const drawSnake = (startX, startY, endX, endY) => {
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Create a curved path (snake-like S-curve)
            // Control points for a smooth S-curve
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // Perpendicular offset for the curve
            const perpAngle = angle + Math.PI / 2;
            const curveOffset = distance * 0.3; // How much the curve bends
            const control1X = startX + (midX - startX) * 0.5 + curveOffset * Math.cos(perpAngle);
            const control1Y = startY + (midY - startY) * 0.5 + curveOffset * Math.sin(perpAngle);
            const control2X = midX + (endX - midX) * 0.5 - curveOffset * Math.cos(perpAngle);
            const control2Y = midY + (endY - midY) * 0.5 - curveOffset * Math.sin(perpAngle);
            
            // Create curved path using cubic Bezier
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`;
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', '#a78bfa'); // Gentle purple/lavender color
            path.setAttribute('stroke-width', '8'); // Thicker line
            path.setAttribute('stroke-opacity', '0.7'); // Softer appearance
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
            
            // Draw snake head (small triangle at the end)
            const headSize = 12;
            const headAngle = Math.atan2(dy, dx);
            const headX = endX - headSize * Math.cos(headAngle);
            const headY = endY - headSize * Math.sin(headAngle);
            const headLeftX = headX - headSize * 0.6 * Math.cos(headAngle - Math.PI / 2);
            const headLeftY = headY - headSize * 0.6 * Math.sin(headAngle - Math.PI / 2);
            const headRightX = headX - headSize * 0.6 * Math.cos(headAngle + Math.PI / 2);
            const headRightY = headY - headSize * 0.6 * Math.sin(headAngle + Math.PI / 2);
            
            const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            head.setAttribute('d', `M ${endX} ${endY} L ${headLeftX} ${headLeftY} L ${headRightX} ${headRightY} Z`);
            head.setAttribute('fill', '#a78bfa');
            head.setAttribute('fill-opacity', '0.7');
            head.setAttribute('stroke', '#a78bfa');
            head.setAttribute('stroke-width', '1');
            head.setAttribute('stroke-opacity', '0.8');
            svg.appendChild(head);
        };

        // Draw snakes (curved, gentle-colored lines)
        gameState.snakes.forEach(snake => {
            const startTile = gameBoard.querySelector(`[data-tile-number="${snake.start}"]`);
            const endTile = gameBoard.querySelector(`[data-tile-number="${snake.end}"]`);
            
            if (startTile && endTile) {
                const startRect = startTile.getBoundingClientRect();
                const endRect = endTile.getBoundingClientRect();

                // Calculate center points relative to board
                const startX = startRect.left + startRect.width / 2 - boardRect.left;
                const startY = startRect.top + startRect.height / 2 - boardRect.top;
                const endX = endRect.left + endRect.width / 2 - boardRect.left;
                const endY = endRect.top + endRect.height / 2 - boardRect.top;

                drawSnake(startX, startY, endX, endY);
            }
        });

        // Draw ladders (realistic ladder with rails and rungs)
        gameState.ladders.forEach(ladder => {
            const startTile = gameBoard.querySelector(`[data-tile-number="${ladder.start}"]`);
            const endTile = gameBoard.querySelector(`[data-tile-number="${ladder.end}"]`);
            
            if (startTile && endTile) {
                const startRect = startTile.getBoundingClientRect();
                const endRect = endTile.getBoundingClientRect();

                // Calculate center points relative to board
                const startX = startRect.left + startRect.width / 2 - boardRect.left;
                const startY = startRect.top + startRect.height / 2 - boardRect.top;
                const endX = endRect.left + endRect.width / 2 - boardRect.left;
                const endY = endRect.top + endRect.height / 2 - boardRect.top;

                drawLadder(startX, startY, endX, endY, '#16a34a');
            }
        });

        gameBoard.appendChild(svg);
    }, 100);
}

// Update pawn positions on board
function updatePawnPositions() {
    const posA = Math.min(Math.max(1, gameState.teamPositions.teamA), TOTAL_TILES);
    const posB = Math.min(Math.max(1, gameState.teamPositions.teamB), TOTAL_TILES);

    // Get existing pawns
    const existingPawnA = document.getElementById('pawnTeamA');
    const existingPawnB = document.getElementById('pawnTeamB');

    // Helper function to update a single pawn
    const updatePawn = (team, position, existingPawn) => {
        const tile = document.querySelector(`[data-tile-number="${position}"]`);
        if (!tile) return;

        const pawnContainer = tile.querySelector('.pawn-container');
        if (!pawnContainer) return;

        // Check if both teams are on the same tile
        const sameTile = posA === posB;
        
        // Determine if this pawn needs to be moved or created
        const needsUpdate = !existingPawn || 
            existingPawn.closest('[data-tile-number]')?.dataset.tileNumber !== String(position) ||
            (sameTile && !existingPawn.classList.contains('pawn-side-by-side')) ||
            (!sameTile && existingPawn.classList.contains('pawn-side-by-side'));

        if (needsUpdate) {
            // Remove existing pawn if it exists
            if (existingPawn) {
                existingPawn.remove();
            }

            // Create new pawn in correct position
            const pawn = document.createElement('div');
            pawn.id = team === 'teamA' ? 'pawnTeamA' : 'pawnTeamB';
            // Use correct class names that match CSS: pawn-team-a or pawn-team-b
            const teamClass = team === 'teamA' ? 'pawn-team-a' : 'pawn-team-b';
            pawn.className = `pawn ${teamClass}`;
            
            if (sameTile) {
                pawn.classList.add('pawn-side-by-side');
                pawn.classList.add(team === 'teamA' ? 'pawn-left' : 'pawn-right');
            }
            
            pawnContainer.appendChild(pawn);
        }
    };

    // Update Team A pawn
    updatePawn('teamA', posA, existingPawnA);
    
    // Update Team B pawn
    updatePawn('teamB', posB, existingPawnB);
}

// Handle dice roll
async function handleRollDice() {
    if (gameState.isRolling || gameState.gameOver) return;

    gameState.isRolling = true;
    disableRollButton();

    try {
        if (gameState.diceBox && gameState.diceBox.roll) {
            // Roll 3D dice
            const rollResult = await gameState.diceBox.roll();
            gameState.diceValue = rollResult[0].value;
        } else {
            // Fallback: random number
            gameState.diceValue = Math.floor(Math.random() * 6) + 1;
            console.warn('Dice not available, using random value:', gameState.diceValue);
        }

        // Show vocabulary challenge modal after dice animation
        showChallengeModal();
    } catch (error) {
        console.error('Error rolling dice:', error);
        gameState.diceValue = Math.floor(Math.random() * 6) + 1;
        showChallengeModal();
    }
}

// Show vocabulary challenge modal
function showChallengeModal() {
    if (gameState.useWords) {
        // Use words mode (4th grade)
        if (gameState.vocabularyWords.length === 0) {
            // No words available, skip challenge
            handleChallengeAnswer(true);
            return;
        }
        
        // Select random word
        const randomIndex = Math.floor(Math.random() * gameState.vocabularyWords.length);
        const selectedWord = gameState.vocabularyWords[randomIndex];
        
        // Show word container, hide image container
        challengeImageContainer.classList.add('hidden');
        challengeWordContainer.classList.remove('hidden');
        challengeWord.textContent = selectedWord;
        challengeModal.classList.remove('hidden');
    } else {
        // Use images mode (3rd grade)
        if (gameState.vocabularyImages.length === 0) {
            // No images available, skip challenge
            handleChallengeAnswer(true);
            return;
        }

        // Select random image
        const randomIndex = Math.floor(Math.random() * gameState.vocabularyImages.length);
        const selectedImage = gameState.vocabularyImages[randomIndex];
        
        // Show image container, hide word container
        challengeWordContainer.classList.add('hidden');
        challengeImageContainer.classList.remove('hidden');
        challengeImage.src = selectedImage.url;
        challengeImage.alt = selectedImage.word;
        challengeModal.classList.remove('hidden');
    }
}

// Handle challenge answer
function handleChallengeAnswer(isCorrect) {
    challengeModal.classList.add('hidden');
    gameState.isRolling = false;

    if (isCorrect) {
        // Move pawn forward
        movePawn(gameState.diceValue);
    } else {
        // No movement, switch turn
        switchTurn();
    }
}

// Move pawn
function movePawn(spaces) {
    const currentPosition = gameState.teamPositions[gameState.currentTeam];
    const targetPosition = currentPosition + spaces;
    
    // If rolling past the end, bounce back
    if (targetPosition > TOTAL_TILES) {
        // Move forward to the end, then move back the excess
        const excess = targetPosition - TOTAL_TILES;
        const finalPosition = TOTAL_TILES - excess;
        
        // First animate forward to the end
        animatePawnMovement(currentPosition, TOTAL_TILES, () => {
            gameState.teamPositions[gameState.currentTeam] = TOTAL_TILES;
            updatePawnPositions();
            updateSidebar();
            
            // Then animate backward the excess
            animatePawnMovement(TOTAL_TILES, finalPosition, () => {
                gameState.teamPositions[gameState.currentTeam] = finalPosition;
                updatePawnPositions();
                updateSidebar();
                
                // Check for snake or ladder (can't win since we bounced back)
                checkSnakeOrLadder(finalPosition);
            });
        });
    } else {
        // Normal movement (doesn't go past the end)
        const newPosition = targetPosition;
        
        // Animate movement
        animatePawnMovement(currentPosition, newPosition, () => {
            gameState.teamPositions[gameState.currentTeam] = newPosition;
            updatePawnPositions();
            updateSidebar();

            // Check win condition only if exactly on tile 60
            if (newPosition === TOTAL_TILES) {
                checkWinCondition();
                return;
            }

            // Check for snake or ladder
            checkSnakeOrLadder(newPosition);
        });
    }
}

// Animate pawn movement
function animatePawnMovement(fromTile, toTile, callback) {
    if (fromTile === toTile) {
        callback();
        return;
    }

    // Ensure we don't go beyond tile 60
    const maxTile = TOTAL_TILES;
    const steps = Math.abs(toTile - fromTile);
    const direction = toTile > fromTile ? 1 : -1;
    let currentStep = 0;

    const animate = () => {
        if (currentStep < steps) {
            const intermediateTile = Math.min(fromTile + (direction * (currentStep + 1)), maxTile);
            gameState.teamPositions[gameState.currentTeam] = intermediateTile;
            updatePawnPositions();
            currentStep++;
            
            // Stop if we've reached tile 60
            if (intermediateTile >= maxTile) {
                callback();
                return;
            }
            
            setTimeout(animate, 200); // 200ms per tile
        } else {
            callback();
        }
    };

    animate();
}

// Check for snake or ladder on landing tile
function checkSnakeOrLadder(tileNumber) {
    // Don't check for snake/ladder if already at tile 60 (exact win)
    if (tileNumber === TOTAL_TILES) {
        checkWinCondition();
        return;
    }

    // Check for snake
    const snake = gameState.snakes.find(s => s.start === tileNumber);
    if (snake) {
        setTimeout(() => {
            animateSnakeSlide(snake.start, snake.end);
        }, 500);
        return;
    }

    // Check for ladder
    const ladder = gameState.ladders.find(l => l.start === tileNumber);
    if (ladder) {
        setTimeout(() => {
            animateLadderClimb(ladder.start, ladder.end);
        }, 500);
        return;
    }

    // No snake or ladder, check win condition and switch turn
    checkWinCondition();
    switchTurn();
}

// Animate snake slide
function animateSnakeSlide(fromTile, toTile) {
    animatePawnMovement(fromTile, toTile, () => {
        gameState.teamPositions[gameState.currentTeam] = toTile;
        updatePawnPositions();
        updateSidebar();
        checkWinCondition();
        switchTurn();
    });
}

// Animate ladder climb
function animateLadderClimb(fromTile, toTile) {
    animatePawnMovement(fromTile, toTile, () => {
        gameState.teamPositions[gameState.currentTeam] = toTile;
        updatePawnPositions();
        updateSidebar();
        checkWinCondition();
        switchTurn();
    });
}

// Check win condition
function checkWinCondition() {
    // Only win if exactly on tile 60
    if (gameState.teamPositions[gameState.currentTeam] === TOTAL_TILES) {
        gameState.gameOver = true;
        // Ensure position is exactly 60
        gameState.teamPositions[gameState.currentTeam] = TOTAL_TILES;
        updatePawnPositions();
        showWinnerOverlay();
    }
}

// Switch turn
function switchTurn() {
    if (gameState.gameOver) return;
    
    gameState.currentTeam = gameState.currentTeam === 'teamA' ? 'teamB' : 'teamA';
    updateSidebar();
    enableRollButton();
}

// Update sidebar UI
function updateSidebar() {
    // Update current turn
    currentTurnEl.textContent = gameState.currentTeam === 'teamA' ? 'Team A' : 'Team B';
    currentTurnEl.className = gameState.currentTeam === 'teamA' 
        ? 'text-xl font-bold text-center text-blue-600' 
        : 'text-xl font-bold text-center text-red-600';

    // Color the turn indicator box based on current team
    if (turnIndicator) {
        if (gameState.currentTeam === 'teamA') {
            turnIndicator.classList.remove('bg-red-50', 'border-red-300');
            turnIndicator.classList.add('bg-blue-50', 'border-blue-300', 'border-2');
        } else {
            turnIndicator.classList.remove('bg-blue-50', 'border-blue-300');
            turnIndicator.classList.add('bg-red-50', 'border-red-300', 'border-2');
        }
    }

    // Update positions
    teamAPositionEl.textContent = gameState.teamPositions.teamA;
    teamBPositionEl.textContent = gameState.teamPositions.teamB;

    // Highlight current team
    if (gameState.currentTeam === 'teamA') {
        teamAInfo.classList.add('border-blue-500', 'bg-blue-50');
        teamAInfo.classList.remove('border-gray-300', 'bg-white');
        teamBInfo.classList.remove('border-red-500', 'bg-red-50');
        teamBInfo.classList.add('border-gray-300', 'bg-white');
    } else {
        teamBInfo.classList.add('border-red-500', 'bg-red-50');
        teamBInfo.classList.remove('border-gray-300', 'bg-white');
        teamAInfo.classList.remove('border-blue-500', 'bg-blue-50');
        teamAInfo.classList.add('border-gray-300', 'bg-white');
    }
}

// Enable/disable roll button
function enableRollButton() {
    rollDiceBtn.disabled = false;
}

function disableRollButton() {
    rollDiceBtn.disabled = true;
}

// Show winner overlay with confetti
function showWinnerOverlay() {
    const winner = gameState.currentTeam === 'teamA' ? 'Team A' : 'Team B';
    winnerText.textContent = `${winner} Wins!`;
    winnerOverlay.classList.remove('hidden');
    
    // Trigger confetti animation
    if (typeof confetti !== 'undefined') {
        // Multiple bursts of confetti
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = gameState.currentTeam === 'teamA' 
            ? ['#3b82f6', '#2563eb', '#1e40af'] 
            : ['#ef4444', '#dc2626', '#991b1b'];
        
        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });
            
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
        
        // Additional burst from center
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: colors
            });
        }, 500);
    }
}

// Hide winner overlay
function hideWinnerOverlay() {
    winnerOverlay.classList.add('hidden');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
