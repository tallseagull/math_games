class MemoryGame {
    constructor() {
        this.allCategories = {};
        this.currentCategory = 'Gimel';
        this.images = [];
        this.cards = [];
        this.selectedCards = [];
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.totalPairs = 0;
        this.matchedPairs = 0;
        this.isProcessing = false;
        this.boardSize = null;
        
        this.initializeElements();
        this.loadCategories();
    }

    initializeElements() {
        this.sizeSelection = document.getElementById('sizeSelection');
        this.gameContainer = document.getElementById('gameContainer');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.player1Score = document.getElementById('player1Score');
        this.player2Score = document.getElementById('player2Score');
        this.player1Points = document.getElementById('player1Points');
        this.player2Points = document.getElementById('player2Points');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.finalPlayer1Score = document.getElementById('finalPlayer1Score');
        this.finalPlayer2Score = document.getElementById('finalPlayer2Score');
        this.winnerMessage = document.getElementById('winnerMessage');
        this.restartButton = document.getElementById('restartButton');
        this.playAgainButton = document.getElementById('playAgainButton');

        // Size selection buttons
        document.querySelectorAll('.size-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const size = parseInt(e.currentTarget.dataset.size);
                this.startGame(size);
            });
        });

        // Restart button
        this.restartButton.addEventListener('click', () => {
            this.resetGame();
        });

        // Play again button
        this.playAgainButton.addEventListener('click', () => {
            this.resetGame();
        });
    }

    async loadCategories() {
        try {
            const response = await fetch('../image_grid/images.json');
            const data = await response.json();
            this.allCategories = data;
            
            // Check URL parameter for category
            const urlParams = new URLSearchParams(window.location.search);
            const categoryParam = urlParams.get('category');
            if (categoryParam && this.allCategories[categoryParam]) {
                this.currentCategory = categoryParam;
            }
            
            // Use the category's image list
            this.images = this.allCategories[this.currentCategory] || [];
            
            if (this.images.length === 0) {
                console.error('No images found for category:', this.currentCategory);
                // Fallback to basic images
                this.images = ['girl', 'cat', 'dog', 'mom', 'boy', 'red', 'blue', 'white', 'black', 'one', 'two', 'three'];
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback images
            this.images = ['girl', 'cat', 'dog', 'mom', 'boy', 'red', 'blue', 'white', 'black', 'one', 'two', 'three'];
        }
    }

    startGame(boardSize) {
        this.boardSize = boardSize;
        const numPairs = boardSize / 2; // 20 or 25 pairs
        
        // Check if we have enough images
        if (this.images.length < numPairs) {
            alert(`Not enough images in category. Need ${numPairs} but only have ${this.images.length}.`);
            return;
        }
        
        // Select random images
        const selectedImages = this.getRandomImages(numPairs);
        
        // Create cards (2 cards per image)
        this.cards = [];
        selectedImages.forEach((imageName, index) => {
            // Create two cards with the same image
            this.cards.push({
                id: `card-${index}-1`,
                imageName: imageName,
                state: 'hidden'
            });
            this.cards.push({
                id: `card-${index}-2`,
                imageName: imageName,
                state: 'hidden'
            });
        });
        
        // Shuffle cards using Fisher-Yates
        this.shuffleCards();
        
        // Reset game state
        this.selectedCards = [];
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.totalPairs = numPairs;
        this.matchedPairs = 0;
        this.isProcessing = false;
        
        // Hide size selection, show game
        this.sizeSelection.style.display = 'none';
        this.gameContainer.style.display = 'flex';
        
        // Render cards
        this.renderCards();
        this.updateScoreboard();
    }

    getRandomImages(count) {
        // Shuffle the images array and take the first 'count' items
        const shuffled = [...this.images];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    shuffleCards() {
        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    renderCards() {
        this.cardsGrid.innerHTML = '';
        
        // Calculate optimal grid layout to fit all cards
        // For 40 cards: 8 columns x 5 rows or 5 columns x 8 rows
        // For 50 cards: 10 columns x 5 rows or 5 columns x 10 rows
        // We want to maximize use of available space (90% width, 100% height)
        let columns, rows;
        if (this.boardSize === 40) {
            // Try 8x5 first (wider layout)
            columns = 8;
            rows = 5;
        } else {
            // 50 cards: 10x5
            columns = 10;
            rows = 5;
        }
        
        this.cardsGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        this.cardsGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.cardId = card.id;
            cardElement.dataset.index = index;
            
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back"></div>
                    <div class="card-face card-front">
                        <img src="../shared/static/images/${card.imageName.replace(/ /g, '_')}.jpg" 
                             alt="${card.imageName}" 
                             onerror="this.parentElement.parentElement.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;color:#ccc;\\'>❓</div>'">
                    </div>
                </div>
            `;
            
            cardElement.addEventListener('click', () => this.handleCardClick(index));
            
            this.cardsGrid.appendChild(cardElement);
        });
    }

    handleCardClick(index) {
        // Ignore clicks if processing or if card is already flipped/matched
        if (this.isProcessing) return;
        
        const card = this.cards[index];
        const cardElement = document.querySelector(`[data-index="${index}"]`);
        
        if (!cardElement || cardElement.classList.contains('flipped') || cardElement.classList.contains('matched')) {
            return;
        }
        
        // Flip the card
        cardElement.classList.add('flipped');
        card.state = 'revealed';
        this.selectedCards.push({ index, card });
        
        // If two cards are selected, check for match
        if (this.selectedCards.length === 2) {
            this.isProcessing = true;
            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const [first, second] = this.selectedCards;
        const firstCard = this.cards[first.index];
        const secondCard = this.cards[second.index];
        
        if (firstCard.imageName === secondCard.imageName) {
            // Match found!
            this.scores[this.currentPlayer]++;
            this.matchedPairs++;
            
            // Mark cards as matched
            const firstElement = document.querySelector(`[data-index="${first.index}"]`);
            const secondElement = document.querySelector(`[data-index="${second.index}"]`);
            
            if (firstElement) firstElement.classList.add('matched');
            if (secondElement) secondElement.classList.add('matched');
            
            firstCard.state = 'matched';
            secondCard.state = 'matched';
            
            // Clear selection and keep current player's turn
            this.selectedCards = [];
            this.isProcessing = false;
            this.updateScoreboard();
            
            // Check if game is over
            if (this.matchedPairs === this.totalPairs) {
                setTimeout(() => this.endGame(), 500);
            }
        } else {
            // No match - flip cards back and switch player
            const firstElement = document.querySelector(`[data-index="${first.index}"]`);
            const secondElement = document.querySelector(`[data-index="${second.index}"]`);
            
            if (firstElement) firstElement.classList.remove('flipped');
            if (secondElement) secondElement.classList.remove('flipped');
            
            firstCard.state = 'hidden';
            secondCard.state = 'hidden';
            
            // Switch player
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            
            // Clear selection
            this.selectedCards = [];
            this.isProcessing = false;
            this.updateScoreboard();
        }
    }

    updateScoreboard() {
        this.player1Points.textContent = this.scores[1];
        this.player2Points.textContent = this.scores[2];
        
        // Update active player highlight
        if (this.currentPlayer === 1) {
            this.player1Score.classList.add('active');
            this.player2Score.classList.remove('active');
            this.turnIndicator.textContent = "Player 1's Turn";
        } else {
            this.player2Score.classList.add('active');
            this.player1Score.classList.remove('active');
            this.turnIndicator.textContent = "Player 2's Turn";
        }
    }

    endGame() {
        this.finalPlayer1Score.textContent = this.scores[1];
        this.finalPlayer2Score.textContent = this.scores[2];
        
        // Determine winner
        if (this.scores[1] > this.scores[2]) {
            this.winnerMessage.textContent = '🎉 Player 1 Wins!';
        } else if (this.scores[2] > this.scores[1]) {
            this.winnerMessage.textContent = '🎉 Player 2 Wins!';
        } else {
            this.winnerMessage.textContent = "It's a Tie!";
        }
        
        this.gameOverOverlay.style.display = 'flex';
    }

    resetGame() {
        // Hide game over overlay
        this.gameOverOverlay.style.display = 'none';
        
        // Show size selection again
        this.sizeSelection.style.display = 'flex';
        this.gameContainer.style.display = 'none';
        
        // Reset all state
        this.cards = [];
        this.selectedCards = [];
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.totalPairs = 0;
        this.matchedPairs = 0;
        this.isProcessing = false;
        this.boardSize = null;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});

