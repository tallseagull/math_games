class ImageGridGame {
    constructor() {
        this.images = [];
        this.currentImages = [];
        
        this.initializeElements();
        this.loadImages();
    }

    initializeElements() {
        this.newGridButton = document.getElementById('newGridButton');
        this.imageGrid = document.getElementById('imageGrid');
        
        this.newGridButton.addEventListener('click', () => this.generateNewGrid());
    }

    async loadImages() {
        try {
            const response = await fetch('images.json');
            const data = await response.json();
            this.images = data.images;
            this.generateNewGrid();
        } catch (error) {
            console.error('Error loading images:', error);
            // Fallback images if JSON fails to load
            this.images = ['girl', 'cat', 'dog', 'mom', 'boy', 'red', 'blue', 'white', 'black', 'one', 'two', 'three'];
            this.generateNewGrid();
        }
    }

    generateNewGrid() {
        // Select 9 random different images
        this.currentImages = this.getRandomImages(9);
        this.displayGrid();
    }

    getRandomImages(count) {
        const shuffled = [...this.images].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    displayGrid() {
        this.imageGrid.innerHTML = '';
        
        this.currentImages.forEach(imageName => {
            const imageTile = document.createElement('div');
            imageTile.className = 'image-tile';
            
            const img = document.createElement('img');
            img.src = `../shared/static/images/${imageName}.jpg`;
            img.alt = imageName;
            img.onerror = () => {
                // If image fails to load, show a placeholder
                imageTile.innerHTML = `<div style="font-size: 40px; color: #ccc;">❓</div>`;
            };
            
            imageTile.appendChild(img);
            this.imageGrid.appendChild(imageTile);
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ImageGridGame();
});
