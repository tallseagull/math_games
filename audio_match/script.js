class AudioMatchGame {
    constructor() {
        this.words = [];
        this.currentWord = '';
        this.currentAudio = null;
        this.score = 0;
        this.attempts = 0;
        this.maxAttempts = 2;
        this.gameActive = true;
        this.recentWords = []; // Track last 10 words shown
        this.solvedWords = new Set(); // Track words successfully solved
        this.audioEnabled = false; // Track if audio is enabled by user interaction
        
        this.initializeElements();
        this.loadWords();
    }

    initializeElements() {
        this.playButton = document.getElementById('playButton');
        this.scoreElement = document.getElementById('score');
        this.imageGrid = document.getElementById('imageGrid');
        this.trophyScreen = document.getElementById('trophyScreen');
        
        this.playButton.addEventListener('click', () => this.enableAudioAndPlay());
        
        // Add click listener to the entire game area to enable audio
        this.imageGrid.addEventListener('click', () => this.enableAudio());
    }

    async loadWords() {
        try {
            const response = await fetch('words.json');
            const data = await response.json();
            this.words = data.words;
            this.startNewRound();
        } catch (error) {
            console.error('Error loading words:', error);
            // Fallback words if JSON fails to load
            this.words = [
                {word: 'mom', weight: 1},
                {word: 'cat', weight: 1},
                {word: 'dog', weight: 1},
                {word: 'car', weight: 1},
                {word: 'ball', weight: 1}
            ];
            this.startNewRound();
        }
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
        
        // Only play audio if it's been enabled by user interaction
        if (this.audioEnabled) {
            this.playCurrentAudio();
        }
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
        
        // Create array with correct word and wrong words
        const allWords = [this.currentWord, ...wrongWords];
        
        // Shuffle the array
        this.shuffleArray(allWords);
        
        // Create image elements
        allWords.forEach(word => {
            const imageOption = document.createElement('div');
            imageOption.className = 'image-option';
            imageOption.dataset.word = word;
            
            const img = document.createElement('img');
            img.src = `static/images/${word}.jpg`;
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
        const availableWords = this.words.filter(wordObj => wordObj.word !== this.currentWord);
        
        while (wrongWords.length < 3 && availableWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            const wordObj = availableWords.splice(randomIndex, 1)[0];
            wrongWords.push(wordObj.word);
        }
        
        return wrongWords;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    enableAudio() {
        if (!this.audioEnabled) {
            this.audioEnabled = true;
            // Play the current audio once enabled
            this.playCurrentAudio();
        }
    }

    enableAudioAndPlay() {
        this.enableAudio();
        this.playCurrentAudio();
    }

    playCurrentAudio() {
        if (!this.audioEnabled) return;
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        this.currentAudio = new Audio(`static/audio/${this.currentWord}.mp3`);
        this.currentAudio.play().catch(error => {
            console.error('Error playing audio:', error);
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
                    if (this.audioEnabled) {
                        this.playCurrentAudio();
                    }
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
        
        // Play audio again if enabled
        if (this.audioEnabled) {
            this.playCurrentAudio();
        }
        
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
document.addEventListener('DOMContentLoaded', () => {
    new AudioMatchGame();
});
