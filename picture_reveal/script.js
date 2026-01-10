class PictureRevealGame {
    constructor() {
        // Background images (1-5) - Kfar Saba images (local static files)
        this.backgroundImages = [
            'static/image1.jpg',
            'static/image2.jpg',
            'static/image3.jpg',
            'static/image4.jpg',
            'static/image5.jpg'
        ];

        // Default vocabulary cards - 20 images from shared/static/images
        this.defaultCoverCardsList = [
            '../shared/static/images/apple.jpg',
            '../shared/static/images/cat.jpg',
            '../shared/static/images/dog.jpg',
            '../shared/static/images/boy.jpg',
            '../shared/static/images/girl.jpg',
            '../shared/static/images/red.jpg',
            '../shared/static/images/blue.jpg',
            '../shared/static/images/green.jpg',
            '../shared/static/images/yellow.jpg',
            '../shared/static/images/black.jpg',
            '../shared/static/images/white.jpg',
            '../shared/static/images/book.jpg',
            '../shared/static/images/ball.jpg',
            '../shared/static/images/house.jpg',
            '../shared/static/images/tree.jpg',
            '../shared/static/images/sun.jpg',
            '../shared/static/images/desk.jpg',
            '../shared/static/images/chair.jpg',
            '../shared/static/images/table.jpg',
            '../shared/static/images/bed.jpg'
        ];

        this.coverCardsList = [];
        this.coverWordsList = []; // For 4th grade words mode
        this.useWords = false; // true for 4th grade, false for images
        this.selectedImageIndex = null;
        this.flippedTiles = new Set();
        this.category = null;
        this.unit = null;
        this.grade = null;
        
        this.initializeElements();
        this.checkGradeAndLoad();
    }

    initializeElements() {
        this.unitSelection = document.getElementById('unitSelection');
        this.imageSelection = document.getElementById('imageSelection');
        this.gameContainer = document.getElementById('gameContainer');
        this.mainGrid = document.getElementById('mainGrid');
        this.imageOptions = document.querySelectorAll('.image-option');
        this.backLink = document.getElementById('backLink');
        this.revealAllButton = document.getElementById('revealAllButton');
        this.allTiles = [];
    }

    checkGradeAndLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        this.grade = urlParams.get('grade');
        this.unit = urlParams.get('unit');
        
        // If unit is specified in URL (from 4th grade selection), load words directly
        if (this.unit) {
            // Unit already selected, load words and show image selection
            this.unitSelection.style.display = 'none';
            this.loadUnitWords();
        } else {
            // Otherwise, load category images (for 3rd grade) or default
            this.loadCategoryImages();
        }
    }

    async loadUnitWords() {
        try {
            // Load words.json from connect4_words folder (same source as connect4_words game)
            const response = await fetch('../connect4_words/words.json');
            const data = await response.json();
            
            const unitKey = `4th_grade_unit${this.unit}`;
            if (data.wordLists && data.wordLists[unitKey] && data.wordLists[unitKey].words) {
                // Use ALL words from the unit (same as connect4_words uses)
                const allWords = data.wordLists[unitKey].words;
                
                // Filter out only question phrases and very long sentences, but keep multi-word phrases
                const validWords = allWords.filter(word => {
                    if (!word || word.trim() === '') return false;
                    // Exclude question phrases and very long sentences
                    if (word.includes('?') || word.includes('…') || word.length > 30) return false;
                    return true;
                });
                
                // Randomly select 20 words (or all if less than 20)
                const shuffled = this.shuffleArray([...validWords]);
                const selectedWords = shuffled.slice(0, 20);
                
                // Store words directly (not image paths) for 4th grade
                this.coverWordsList = selectedWords;
                this.useWords = true;
            } else {
                // Fallback to default images
                this.coverCardsList = [...this.defaultCoverCardsList];
            }
        } catch (error) {
            console.error('Error loading unit words:', error);
            // Fallback to default images
            this.coverCardsList = [...this.defaultCoverCardsList];
        }
        
        // Setup event listeners after words are loaded
        this.setupEventListeners();
    }

    async loadCategoryImages() {
        // Check URL parameter for category
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        
        if (categoryParam) {
            this.category = categoryParam;
            try {
                // Load images.json from image_grid folder
                const response = await fetch('../image_grid/images.json');
                const data = await response.json();
                
                if (data[categoryParam] && Array.isArray(data[categoryParam])) {
                    // Get images for this category
                    const categoryImages = data[categoryParam];
                    
                    // Randomly select 20 images (or all if less than 20)
                    const shuffled = this.shuffleArray([...categoryImages]);
                    const selectedImages = shuffled.slice(0, 20);
                    
                    // Convert image names to paths
                    this.coverCardsList = selectedImages.map(imageName => {
                        // Replace spaces with underscores in image filename (same as image_grid)
                        const imageFileName = imageName.replace(/ /g, '_');
                        return `../shared/static/images/${imageFileName}.jpg`;
                    });
                } else {
                    // Fallback to default images
                    this.coverCardsList = [...this.defaultCoverCardsList];
                }
            } catch (error) {
                console.error('Error loading category images:', error);
                // Fallback to default images
                this.coverCardsList = [...this.defaultCoverCardsList];
            }
        } else {
            // No category specified, use default images
            this.coverCardsList = [...this.defaultCoverCardsList];
        }
        
        // Setup event listeners after images are loaded
        this.setupEventListeners();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    setupEventListeners() {
        // Image selection buttons (only for image selection screen, not unit selection)
        const imageSelectionButtons = this.imageSelection.querySelectorAll('.image-option[data-image]');
        imageSelectionButtons.forEach(button => {
            // Remove existing listeners to avoid duplicates
            button.replaceWith(button.cloneNode(true));
        });
        // Re-query after cloning
        const freshButtons = this.imageSelection.querySelectorAll('.image-option[data-image]');
        freshButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const imageIndex = parseInt(e.target.getAttribute('data-image')) - 1;
                this.selectImage(imageIndex);
            });
        });
        
        // Back button - check if came from grade selection
        if (this.backLink) {
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category');
            const grade = urlParams.get('grade');
            const unit = urlParams.get('unit');
            const listKey = urlParams.get('listKey');
            
            if (category || grade || unit || listKey) {
                // Came from grade selection, go back to golda
                this.backLink.href = '../golda/index.html';
            } else {
                // Came from main menu
                this.backLink.href = '../index.html';
            }
        }
        
        // Reveal all button
        if (this.revealAllButton) {
            this.revealAllButton.addEventListener('click', () => this.revealAllCards());
        }
    }

    selectImage(imageIndex) {
        this.selectedImageIndex = imageIndex;
        
        // Set background image using CSS variable
        const backgroundUrl = this.backgroundImages[imageIndex];
        this.mainGrid.style.backgroundImage = `url("${backgroundUrl}")`;
        
        // Hide selection screen and show game
        this.imageSelection.style.display = 'none';
        this.gameContainer.style.display = 'block';
        
        // Initialize the grid
        this.initializeGrid();
    }

    initializeGrid() {
        // Clear any existing tiles
        this.mainGrid.innerHTML = '';
        this.flippedTiles.clear();
        this.allTiles = [];

        // Grid dimensions
        const cols = 5;
        const rows = 4;
        const tileWidth = 160; // 800px / 5
        const tileHeight = 150; // 600px / 4

        // Create 20 tiles (5 columns x 4 rows)
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tileIndex = row * cols + col;
                const tile = this.createTile(tileIndex, col * tileWidth, row * tileHeight);
                this.mainGrid.appendChild(tile);
                this.allTiles.push(tile);
            }
        }
        
        // Update reveal button state
        this.updateRevealButtonState();
    }

    createTile(index, left, top) {
        // Create tile container
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.left = `${left}px`;
        tile.style.top = `${top}px`;
        tile.dataset.index = index;

        // Create card inner container for 3D flip
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';

        // Create front face (vocabulary image or word)
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        
        if (this.useWords && this.coverWordsList[index]) {
            // 4th grade mode: display word as text
            const wordElement = document.createElement('div');
            wordElement.className = 'card-word';
            const word = this.coverWordsList[index];
            wordElement.textContent = word;
            
            // Adjust font size based on word/phrase length
            // Card dimensions: 160px width, 150px height (with 8px padding = 144px usable)
            const wordLength = word.length;
            const hasSpace = word.includes(' '); // Check if it's a multi-word phrase
            let fontSize;
            
            // For multi-word phrases (with spaces), allow 2-line wrapping but use smaller font
            if (hasSpace) {
                // Multi-word phrases can wrap to 2 lines at spaces, use smaller font
                if (wordLength > 20) {
                    fontSize = '1.4rem'; // Very long phrases
                } else if (wordLength > 15) {
                    fontSize = '1.6rem'; // Medium-long phrases
                } else {
                    fontSize = '1.8rem'; // Short multi-word phrases
                }
            } else {
                // Single words - single line, adjust based on length
                if (wordLength > 15) {
                    fontSize = '1.2rem';
                } else if (wordLength > 12) {
                    fontSize = '1.5rem';
                } else if (wordLength > 9) {
                    fontSize = '1.8rem';
                } else if (wordLength > 6) {
                    fontSize = '2.2rem';
                } else {
                    fontSize = '2.5rem';
                }
            }
            
            wordElement.style.fontSize = fontSize;
            
            cardFront.appendChild(wordElement);
        } else {
            // 3rd grade mode: display image
            const frontImg = document.createElement('img');
            frontImg.src = this.coverCardsList[index];
            frontImg.alt = `Vocabulary card ${index + 1}`;
            cardFront.appendChild(frontImg);
        }

        // Create back face (transparent to show background)
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';

        // Assemble the card
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        tile.appendChild(cardInner);

        // Add click handler
        tile.addEventListener('click', () => this.flipTile(tile, index));

        return tile;
    }

    flipTile(tile, index) {
        // Prevent flipping if already flipped
        if (this.flippedTiles.has(index)) {
            return;
        }

        // Mark as flipped
        this.flippedTiles.add(index);
        tile.classList.add('flipped');
        
        // After flip animation completes, remove card-inner to reveal background
        setTimeout(() => {
            const cardInner = tile.querySelector('.card-inner');
            if (cardInner) {
                cardInner.style.display = 'none';
            }
            this.updateRevealButtonState();
        }, 900); // 600ms flip + 300ms buffer
    }
    
    updateRevealButtonState() {
        if (this.revealAllButton) {
            const remainingCount = 20 - this.flippedTiles.size;
            this.revealAllButton.disabled = remainingCount === 0;
        }
    }
    
    revealAllCards() {
        // Get all unflipped tiles
        const unflippedTiles = this.allTiles.filter((tile, index) => {
            return !this.flippedTiles.has(index);
        });
        
        if (unflippedTiles.length === 0) {
            return;
        }
        
        // Disable button during reveal
        if (this.revealAllButton) {
            this.revealAllButton.disabled = true;
        }
        
        // Flip each card one by one with a delay
        unflippedTiles.forEach((tile, i) => {
            const index = parseInt(tile.dataset.index);
            setTimeout(() => {
                this.flipTile(tile, index);
            }, i * 100); // 100ms delay between each flip
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PictureRevealGame();
});
