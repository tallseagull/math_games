class AudioMatchGame {
    constructor() {
        this.words = [];
        this.allCategories = {}; // Store all categories from JSON
        this.currentCategory = null; // Currently selected category
        this.currentWord = '';
        this.currentAudio = null;
        this.score = 0;
        this.attempts = 0;
        this.maxAttempts = 2;
        this.gameActive = true;
        this.recentWords = []; // Track last 10 words shown
        this.solvedWords = new Set(); // Track words successfully solved
        this.audioEnabled = true; // Start with audio enabled
        
        this.initializeElements();
        this.loadCategories();
    }

    initializeElements() {
        this.playButton = document.getElementById('playButton');
        this.scoreElement = document.getElementById('score');
        this.imageGrid = document.getElementById('imageGrid');
        this.trophyScreen = document.getElementById('trophyScreen');
        this.categorySelection = document.getElementById('categorySelection');
        this.categoryGrid = document.getElementById('categoryGrid');
        this.gameContainer = document.getElementById('gameContainer');
        this.changeCategoryButton = document.getElementById('changeCategoryButton');
        
        this.playButton.addEventListener('click', () => this.playCurrentAudio());
        this.changeCategoryButton.addEventListener('click', () => this.showCategorySelection());
        
        // Update play button appearance based on audio state
        this.updatePlayButtonAppearance();
    }

    async loadCategories() {
        try {
            const response = await fetch('words.json');
            const data = await response.json();
            this.allCategories = data;
            
            // Check URL parameter first (for Golda integration)
            const urlParams = new URLSearchParams(window.location.search);
            const categoryParam = urlParams.get('category');
            if (categoryParam && this.allCategories[categoryParam]) {
                this.selectCategory(categoryParam);
                return;
            }
            
            // Check if there's a saved category in localStorage
            const savedCategory = localStorage.getItem('audioMatchCategory');
            if (savedCategory && this.allCategories[savedCategory]) {
                this.selectCategory(savedCategory);
            } else {
                // Show category selection screen
                this.showCategorySelection();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback words if JSON fails to load
            this.allCategories = {
                'basic': [
                    {word: 'mom', weight: 1},
                    {word: 'cat', weight: 1},
                    {word: 'dog', weight: 1}
                ]
            };
            this.showCategorySelection();
        }
    }

    showCategorySelection() {
        this.categorySelection.style.display = 'flex';
        this.gameContainer.style.display = 'none';
        this.gameActive = false;
        
        // Clear and populate category grid
        this.categoryGrid.innerHTML = '';
        
        // Category icons mapping
        const categoryIcons = {
            'all': '🌈',
            'numbers': '🔢',
            'colors': '🎨',
            'people': '👥',
            'animals': '🐾',
            'objects': '📦',
            'adjectives': '📏',
            'body': '👃'
        };
        
        Object.keys(this.allCategories).forEach(categoryKey => {
            const categoryOption = document.createElement('div');
            categoryOption.className = 'category-option';
            
            const icon = document.createElement('div');
            icon.className = 'category-icon';
            icon.textContent = categoryIcons[categoryKey] || '📚';
            
            const name = document.createElement('div');
            name.className = 'category-name';
            name.textContent = categoryKey;
            
            const count = document.createElement('div');
            count.className = 'category-count';
            count.textContent = `${this.allCategories[categoryKey].length} words`;
            
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
        this.words = this.allCategories[categoryKey];
        
        // Save selection to localStorage
        localStorage.setItem('audioMatchCategory', categoryKey);
        
        // Hide category selection and show game
        this.categorySelection.style.display = 'none';
        this.gameContainer.style.display = 'flex';
        this.gameActive = true;
        
        // Reset game state
        this.score = 0;
        this.updateScore();
        this.recentWords = [];
        this.solvedWords.clear();
        
        // Start the game
        this.startNewRound();
    }

    startNewRound() {
        if (!this.gameActive) return;
        
        this.attempts = 0;
        this.currentWord = this.getRandomWord();
        
        // Add to recent words and maintain max 10
        this.recentWords.push(this.currentWord);
        if (this.recentWords.length > 10) {
            this.recentWords.shift(); // Remove oldest
        }
        
        this.loadImages();
        
        // Play audio automatically
        this.playCurrentAudio();
    }

    getRandomWord() {
        // Get available words (not in recent 10 and not solved)
        const availableWords = this.words.filter(wordObj => 
            !this.recentWords.includes(wordObj.word) && !this.solvedWords.has(wordObj.word)
        );
        
        // If no available words, reset recent words but keep solved words
        if (availableWords.length === 0) {
            this.recentWords = [];
            const resetAvailableWords = this.words.filter(wordObj => !this.solvedWords.has(wordObj.word));
            
            // If still no words (all solved), reset everything
            if (resetAvailableWords.length === 0) {
                this.solvedWords.clear();
                return this.getWeightedRandomWord(this.words);
            }
            
            return this.getWeightedRandomWord(resetAvailableWords);
        }
        
        return this.getWeightedRandomWord(availableWords);
    }

    getWeightedRandomWord(wordList) {
        // Calculate total weight
        const totalWeight = wordList.reduce((sum, wordObj) => sum + wordObj.weight, 0);
        
        // Generate random number between 0 and totalWeight
        let random = Math.random() * totalWeight;
        
        // Find the word based on weight
        for (const wordObj of wordList) {
            random -= wordObj.weight;
            if (random <= 0) {
                return wordObj.word;
            }
        }
        
        // Fallback to last word (shouldn't happen)
        return wordList[wordList.length - 1].word;
    }

    loadImages() {
        this.imageGrid.innerHTML = '';
        
        // Get 3 random wrong words
        const wrongWords = this.getRandomWrongWords();
        
        // Create array with correct word and wrong words, ensuring uniqueness
        const allWords = [this.currentWord];
        const usedWords = new Set([this.currentWord]);
        for (const word of wrongWords) {
            if (!usedWords.has(word)) {
                allWords.push(word);
                usedWords.add(word);
            }
        }
        
        // Shuffle the array
        this.shuffleArray(allWords);
        
        // Create image elements
        allWords.forEach(word => {
            const imageOption = document.createElement('div');
            imageOption.className = 'image-option';
            imageOption.dataset.word = word;
            
            const img = document.createElement('img');
            // Replace spaces with underscores in image filename
            const imageFileName = word.replace(/ /g, '_');
            img.src = `../shared/static/images/${imageFileName}.jpg`;
            img.alt = word;
            img.onerror = () => {
                // If image fails to load, show a placeholder
                imageOption.innerHTML = `<div style="font-size: 60px;">❓</div>`;
            };
            
            imageOption.appendChild(img);
            imageOption.addEventListener('click', () => this.handleImageClick(word, imageOption));
            
            this.imageGrid.appendChild(imageOption);
        });
    }

    getRandomWrongWords() {
        const wrongWords = [];
        const usedWords = new Set([this.currentWord]); // Track used words to ensure uniqueness
        
        // Get unique available words (filter out current word and get unique word strings)
        const uniqueAvailableWords = [];
        const seenWords = new Set();
        for (const wordObj of this.words) {
            if (wordObj.word !== this.currentWord && !seenWords.has(wordObj.word)) {
                uniqueAvailableWords.push(wordObj.word);
                seenWords.add(wordObj.word);
            }
        }
        
        // Shuffle and pick 3 unique wrong words
        const shuffled = [...uniqueAvailableWords].sort(() => Math.random() - 0.5);
        
        while (wrongWords.length < 3 && shuffled.length > 0) {
            const word = shuffled.pop();
            if (!usedWords.has(word)) {
                wrongWords.push(word);
                usedWords.add(word);
            }
        }
        
        return wrongWords;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    updatePlayButtonAppearance() {
        this.playButton.textContent = '🔊';
        this.playButton.style.opacity = '1';
    }

    showAudioPrompt() {
        // Add a subtle visual prompt to click the play button
        this.playButton.title = 'Click to enable audio';
    }

    playCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        this.currentAudio = new Audio(`../shared/static/audio/${this.currentWord}.mp3`);
        this.currentAudio.play().catch(error => {
            console.error('Error playing audio:', error);
            // If autoplay fails, show visual prompt
            this.showAudioPrompt();
        });
    }

    handleImageClick(clickedWord, imageElement) {
        if (!this.gameActive) return;
        
        const allImages = this.imageGrid.querySelectorAll('.image-option');
        allImages.forEach(img => img.classList.add('disabled'));
        
        if (clickedWord === this.currentWord) {
            // Correct answer
            imageElement.classList.add('correct');
            this.score++;
            this.solvedWords.add(this.currentWord); // Mark as solved
            this.updateScore();
            
            setTimeout(() => {
                if (this.score >= 10) {
                    this.showTrophyScreen();
                } else {
                    this.startNewRound();
                }
            }, 1500);
        } else {
            // Wrong answer
            imageElement.classList.add('incorrect');
            this.attempts++;
            
            if (this.attempts < this.maxAttempts) {
                // Show another try
                setTimeout(() => {
                    this.resetImageStates();
                    this.playCurrentAudio();
                }, 1500);
            } else {
                // Show correct answer
                setTimeout(() => {
                    this.showCorrectAnswer();
                }, 1500);
            }
        }
    }

    resetImageStates() {
        const allImages = this.imageGrid.querySelectorAll('.image-option');
        allImages.forEach(img => {
            img.classList.remove('correct', 'incorrect', 'disabled');
        });
    }

    showCorrectAnswer() {
        const allImages = this.imageGrid.querySelectorAll('.image-option');
        allImages.forEach(img => {
            if (img.dataset.word === this.currentWord) {
                img.classList.add('correct');
            }
        });
        
        // Play audio again
        this.playCurrentAudio();
        
        // Start new round after showing correct answer
        setTimeout(() => {
            this.startNewRound();
        }, 3000);
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    showTrophyScreen() {
        this.gameActive = false;
        this.trophyScreen.classList.add('show');
        
        // Play celebration sound if available
        const celebrationAudio = new Audio('static/audio/celebration.mp3');
        celebrationAudio.play().catch(() => {
            // Ignore if celebration sound doesn't exist
        });
        
        // Hide trophy screen after 5 seconds and restart game
        setTimeout(() => {
            this.trophyScreen.classList.remove('show');
            this.score = 0;
            this.updateScore();
            this.recentWords = []; // Reset recent words
            this.solvedWords.clear(); // Reset solved words
            this.gameActive = true;
            this.startNewRound();
        }, 5000);
    }
}

// Initialize the game when the page loads
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

document.addEventListener('DOMContentLoaded', () => {
    new AudioMatchGame();
    setupBackLink();
});
