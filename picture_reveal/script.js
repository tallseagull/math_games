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
        this.selectedImageIndex = null;
        this.flippedTiles = new Set();
        this.category = null;
        
        this.initializeElements();
        this.loadCategoryImages();
    }

    initializeElements() {
        this.imageSelection = document.getElementById('imageSelection');
        this.gameContainer = document.getElementById('gameContainer');
        this.mainGrid = document.getElementById('mainGrid');
        this.imageOptions = document.querySelectorAll('.image-option');
        this.backLink = document.getElementById('backLink');
        this.revealAllButton = document.getElementById('revealAllButton');
        this.allTiles = [];
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
        // Image selection buttons
        this.imageOptions.forEach(button => {
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

        // Create front face (vocabulary image)
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        const frontImg = document.createElement('img');
        frontImg.src = this.coverCardsList[index];
        frontImg.alt = `Vocabulary card ${index + 1}`;
        cardFront.appendChild(frontImg);

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
