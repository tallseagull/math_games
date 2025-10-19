class ImageGridGame {
    constructor() {
        this.images = [];
        this.allCategories = {}; // Store all categories from JSON
        this.currentCategory = null; // Currently selected category
        this.currentImages = [];
        
        this.initializeElements();
        this.loadCategories();
    }

    initializeElements() {
        this.newGridButton = document.getElementById('newGridButton');
        this.imageGrid = document.getElementById('imageGrid');
        this.categorySelection = document.getElementById('categorySelection');
        this.categoryGrid = document.getElementById('categoryGrid');
        this.gameContainer = document.getElementById('gameContainer');
        this.changeCategoryButton = document.getElementById('changeCategoryButton');
        
        this.newGridButton.addEventListener('click', () => this.generateNewGrid());
        this.changeCategoryButton.addEventListener('click', () => this.showCategorySelection());
    }

    async loadCategories() {
        try {
            const response = await fetch('images.json');
            const data = await response.json();
            this.allCategories = data;
            
            // Check if there's a saved category in localStorage
            const savedCategory = localStorage.getItem('imageGridCategory');
            if (savedCategory && this.allCategories[savedCategory]) {
                this.selectCategory(savedCategory);
            } else {
                // Show category selection screen
                this.showCategorySelection();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback images if JSON fails to load
            this.allCategories = {
                'basic': ['girl', 'cat', 'dog', 'mom', 'boy', 'red', 'blue', 'white', 'black', 'one', 'two', 'three']
            };
            this.showCategorySelection();
        }
    }

    showCategorySelection() {
        this.categorySelection.style.display = 'flex';
        this.gameContainer.style.display = 'none';
        
        // Clear and populate category grid
        this.categoryGrid.innerHTML = '';
        
        // Category icons mapping
        const categoryIcons = {
            'Partani': '🌈',
            'Gimel': '📚',
            'numbers': '🔢',
            'colors': '🎨',
            'people': '👥'
        };
        
        Object.keys(this.allCategories).forEach(categoryKey => {
            const categoryOption = document.createElement('div');
            categoryOption.className = 'category-option';
            
            const icon = document.createElement('div');
            icon.className = 'category-icon';
            icon.textContent = categoryIcons[categoryKey] || '📁';
            
            const name = document.createElement('div');
            name.className = 'category-name';
            name.textContent = categoryKey;
            
            const count = document.createElement('div');
            count.className = 'category-count';
            count.textContent = `${this.allCategories[categoryKey].length} images`;
            
            categoryOption.appendChild(icon);
            categoryOption.appendChild(name);
            categoryOption.appendChild(count);
            
            categoryOption.addEventListener('click', () => {
                this.selectCategory(categoryKey);
            });
            
            this.categoryGrid.appendChild(categoryOption);
        });
    }

    selectCategory(categoryKey) {
        this.currentCategory = categoryKey;
        this.images = this.allCategories[categoryKey];
        
        // Save selection to localStorage
        localStorage.setItem('imageGridCategory', categoryKey);
        
        // Hide category selection and show game
        this.categorySelection.style.display = 'none';
        this.gameContainer.style.display = 'flex';
        
        // Start the game
        this.generateNewGrid();
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
