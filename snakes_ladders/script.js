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
let rollDiceBtn, correctBtn, incorrectBtn, newGameBtn, playAgainBtn;
let currentTurnEl, turnIndicator, teamAPositionEl, teamBPositionEl, teamAInfo, teamBInfo;
let winnerOverlay, winnerText;

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

    // Load vocabulary images
    await loadVocabularyImages();

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
    } catch (error) {
        console.error('Error loading vocabulary images:', error);
        // Fallback to placeholder images
        gameState.vocabularyImages = Array.from({ length: 60 }, (_, i) => ({
            word: `word${i + 1}`,
            url: `../shared/static/images/apple.jpg`
        }));
    }
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
function getTileRowCol(tileNumber) {
    const row = Math.floor((tileNumber - 1) / BOARD_COLS);
    const col = (row % 2 === 0) 
        ? (tileNumber - 1) % BOARD_COLS
        : BOARD_COLS - 1 - ((tileNumber - 1) % BOARD_COLS);
    return { row, col };
}

// Helper function to get tile number from row and column
function getTileNumber(row, col) {
    if (row % 2 === 0) {
        // Left to right
        return row * BOARD_COLS + col + 1;
    } else {
        // Right to left
        return (row + 1) * BOARD_COLS - col;
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
    // With zigzag pattern: one row DOWN = ladders (tile number increases)
    //                      one row UP = snakes (tile number decreases)
    const allLadderPairs = [];
    const allSnakePairs = [];
    
    // Find all valid ladder pairs (one row DOWN, same column, end > start)
    // Ladders go down one row visually (row N -> row N+1), but tile number increases
    for (let startRow = 0; startRow < BOARD_ROWS - 1; startRow++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const start = getTileNumber(startRow, col);
            const endRow = startRow + 1; // One row down visually
            const end = getTileNumber(endRow, col);
            
            // Ladder must go up in tile numbers (end > start)
            // Cannot end on tile 60 (last square)
            // Cannot start on tile 1 (starting position)
            if (end > start && end < TOTAL_TILES && start > 1) {
                allLadderPairs.push({ start, end });
            }
        }
    }
    
    // Find all valid snake pairs (one row UP, same column, end < start)
    // Snakes go up one row visually (row N -> row N-1), but tile number decreases
    for (let startRow = 1; startRow < BOARD_ROWS; startRow++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const start = getTileNumber(startRow, col);
            const endRow = startRow - 1; // One row up visually
            const end = getTileNumber(endRow, col);
            
            // Snake must go down in tile numbers (end < start)
            // Cannot start on tile 60 (last square)
            if (end < start && end >= 1 && start < TOTAL_TILES) {
                allSnakePairs.push({ start, end });
            }
        }
    }
    
    
    // Shuffle and select ladders (try multiple times if needed)
    let ladderAttempts = 0;
    while (gameState.ladders.length < numLadders && ladderAttempts < 10) {
        const shuffledLadders = [...allLadderPairs].sort(() => Math.random() - 0.5);
        const tempUsed = new Set(usedTiles);
        const tempLadders = [];
        
        for (const pair of shuffledLadders) {
            if (tempLadders.length >= numLadders) break;
            if (!tempUsed.has(pair.start) && !tempUsed.has(pair.end)) {
                tempLadders.push(pair);
                tempUsed.add(pair.start);
                tempUsed.add(pair.end);
            }
        }
        
        if (tempLadders.length >= numLadders) {
            gameState.ladders = tempLadders.slice(0, numLadders);
            tempLadders.slice(0, numLadders).forEach(p => {
                usedTiles.add(p.start);
                usedTiles.add(p.end);
            });
            break;
        }
        ladderAttempts++;
    }
    
    // Shuffle and select snakes (try multiple times if needed)
    let snakeAttempts = 0;
    while (gameState.snakes.length < numSnakes && snakeAttempts < 10) {
        const shuffledSnakes = [...allSnakePairs].sort(() => Math.random() - 0.5);
        const tempSnakes = [];
        
        for (const pair of shuffledSnakes) {
            if (tempSnakes.length >= numSnakes) break;
            if (!usedTiles.has(pair.start) && !usedTiles.has(pair.end)) {
                tempSnakes.push(pair);
                usedTiles.add(pair.start);
                usedTiles.add(pair.end);
            }
        }
        
        if (tempSnakes.length >= numSnakes) {
            gameState.snakes = tempSnakes.slice(0, numSnakes);
            break;
        }
        snakeAttempts++;
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

    // Create tiles in snake pattern
    const tiles = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
        const rowTiles = [];
        for (let col = 0; col < BOARD_COLS; col++) {
            const tileNum = row % 2 === 0 
                ? row * BOARD_COLS + col + 1
                : (row + 1) * BOARD_COLS - col;
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

        // Helper function to draw arrow (less prominent)
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

        // Draw snakes (less prominent red arrows pointing down)
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

                drawArrow(startX, startY, endX, endY, '#dc2626', '5');
            }
        });

        // Draw ladders (less prominent green arrows pointing up)
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

                drawArrow(startX, startY, endX, endY, '#16a34a', '5');
            }
        });

        gameBoard.appendChild(svg);
    }, 100);
}

// Update pawn positions on board
function updatePawnPositions() {
    // Remove existing pawns
    document.querySelectorAll('.pawn').forEach(pawn => pawn.remove());

    const posA = Math.min(Math.max(1, gameState.teamPositions.teamA), TOTAL_TILES);
    const posB = Math.min(Math.max(1, gameState.teamPositions.teamB), TOTAL_TILES);

    // Check if both teams are on the same tile
    if (posA === posB) {
        // Both teams on same tile - position side by side
        const tile = document.querySelector(`[data-tile-number="${posA}"]`);
        if (tile) {
            const pawnContainer = tile.querySelector('.pawn-container');
            if (pawnContainer) {
                // Add both pawns side by side
                const pawnA = document.createElement('div');
                pawnA.className = 'pawn pawn-team-a pawn-side-by-side pawn-left';
                pawnA.id = 'pawnTeamA';
                pawnContainer.appendChild(pawnA);

                const pawnB = document.createElement('div');
                pawnB.className = 'pawn pawn-team-b pawn-side-by-side pawn-right';
                pawnB.id = 'pawnTeamB';
                pawnContainer.appendChild(pawnB);
            }
        }
    } else {
        // Teams on different tiles - position normally
        const tileA = document.querySelector(`[data-tile-number="${posA}"]`);
        if (tileA) {
            const pawnContainer = tileA.querySelector('.pawn-container');
            if (pawnContainer) {
                const pawnA = document.createElement('div');
                pawnA.className = 'pawn pawn-team-a';
                pawnA.id = 'pawnTeamA';
                pawnContainer.appendChild(pawnA);
            }
        }

        const tileB = document.querySelector(`[data-tile-number="${posB}"]`);
        if (tileB) {
            const pawnContainer = tileB.querySelector('.pawn-container');
            if (pawnContainer) {
                const pawnB = document.createElement('div');
                pawnB.className = 'pawn pawn-team-b';
                pawnB.id = 'pawnTeamB';
                pawnContainer.appendChild(pawnB);
            }
        }
    }
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
    if (gameState.vocabularyImages.length === 0) {
        // No images available, skip challenge
        handleChallengeAnswer(true);
        return;
    }

    // Select random image
    const randomIndex = Math.floor(Math.random() * gameState.vocabularyImages.length);
    const selectedImage = gameState.vocabularyImages[randomIndex];
    
    challengeImage.src = selectedImage.url;
    challengeImage.alt = selectedImage.word;
    challengeModal.classList.remove('hidden');
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
    // Stop at tile 60 (don't go beyond)
    let newPosition = Math.min(currentPosition + spaces, TOTAL_TILES);

    // Animate movement
    animatePawnMovement(currentPosition, newPosition, () => {
        gameState.teamPositions[gameState.currentTeam] = newPosition;
        updatePawnPositions();
        updateSidebar();

        // Check win condition first (if reached tile 60)
        if (newPosition >= TOTAL_TILES) {
            checkWinCondition();
            return;
        }

        // Check for snake or ladder
        checkSnakeOrLadder(newPosition);
    });
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
    // Don't check for snake/ladder if already at tile 60
    if (tileNumber >= TOTAL_TILES) {
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
    if (gameState.teamPositions[gameState.currentTeam] >= TOTAL_TILES) {
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
