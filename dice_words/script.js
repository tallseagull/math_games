class DiceWordGame {
    constructor() {
        this.configurations = [];
        this.currentConfiguration = null;
        this.diceLetterMaps = {}; // Maps dice index to face-to-letter mapping
        this.isRolling = false;
        
        this.initializeElements();
        this.loadConfigurations();
    }

    initializeElements() {
        this.configurationSelection = document.getElementById('configurationSelection');
        this.configurationGrid = document.getElementById('configurationGrid');
        this.gameContainer = document.getElementById('gameContainer');
        this.changeConfigurationButton = document.getElementById('changeConfigurationButton');
        this.wordDisplay = document.getElementById('wordDisplay');
        this.wordText = document.getElementById('wordText');
        this.rollButton = document.getElementById('rollButton');
        this.diceBoxElement = document.getElementById('dice-box');
        
        this.changeConfigurationButton.addEventListener('click', () => this.showConfigurationSelection());
        this.rollButton.addEventListener('click', () => this.rollDice());
    }

    async loadConfigurations() {
        try {
            const response = await fetch('config.json');
            const data = await response.json();
            this.configurations = data.configurations || [];
            
            // Check if there's a saved configuration in localStorage
            const savedConfig = localStorage.getItem('diceWordGameConfig');
            if (savedConfig && this.configurations.find(c => c.name === savedConfig)) {
                this.selectConfiguration(savedConfig);
            } else {
                this.showConfigurationSelection();
            }
        } catch (error) {
            console.error('Error loading configurations:', error);
            // Fallback configuration
            this.configurations = [{
                name: 'Default',
                dice: {
                    "1": ["A", "B", "C", "D", "E", "F"],
                    "2": ["G", "H", "I", "J", "K", "L"],
                    "3": ["M", "N", "O", "P", "Q", "R"]
                }
            }];
            this.showConfigurationSelection();
        }
    }

    showConfigurationSelection() {
        this.configurationSelection.style.display = 'flex';
        this.gameContainer.style.display = 'none';
        
        // Clear and populate configuration grid
        this.configurationGrid.innerHTML = '';
        
        this.configurations.forEach(config => {
            const configOption = document.createElement('div');
            configOption.className = 'configuration-option';
            
            const icon = document.createElement('div');
            icon.className = 'configuration-icon';
            icon.textContent = '🎲';
            
            const name = document.createElement('div');
            name.className = 'configuration-name';
            name.textContent = config.name;
            
            const count = document.createElement('div');
            count.className = 'configuration-count';
            count.textContent = '3 dice';
            
            configOption.appendChild(icon);
            configOption.appendChild(name);
            configOption.appendChild(count);
            
            configOption.addEventListener('click', () => {
                this.selectConfiguration(config.name);
            });
            
            this.configurationGrid.appendChild(configOption);
        });
    }

    async selectConfiguration(configName) {
        this.currentConfiguration = this.configurations.find(c => c.name === configName);
        if (!this.currentConfiguration) return;
        
        // Save selection to localStorage
        localStorage.setItem('diceWordGameConfig', configName);
        
        // Hide configuration selection and show game
        this.configurationSelection.style.display = 'none';
        this.gameContainer.style.display = 'flex';
        
        // Hide word display initially
        this.wordDisplay.style.display = 'none';
        
        // Assign letters to dice faces
        this.assignLettersToDice();
        
        // Initialize DiceBox
        await this.initializeDiceBox();
    }

    assignLettersToDice() {
        this.diceLetterMaps = {};
        
        // Process each dice position (1, 2, 3)
        for (let position = 1; position <= 3; position++) {
            const positionKey = position.toString();
            const letters = this.currentConfiguration.dice[positionKey] || [];
            
            let assignedLetters = [];
            
            if (letters.length > 6) {
                // More than 6 letters: randomly select 6 unique letters
                const shuffled = [...letters].sort(() => Math.random() - 0.5);
                assignedLetters = shuffled.slice(0, 6);
            } else if (letters.length < 6) {
                // Less than 6 letters: sample with repetition
                while (assignedLetters.length < 6) {
                    assignedLetters = assignedLetters.concat(letters);
                }
                assignedLetters = assignedLetters.slice(0, 6);
            } else {
                // Exactly 6 letters: use all
                assignedLetters = [...letters];
            }
            
            // Create mapping: face index (0-5) -> letter
            this.diceLetterMaps[position - 1] = assignedLetters;
        }
    }

    async initializeDiceBox() {
        // Clear existing dice container
        this.diceBoxElement.innerHTML = '';
        
        // Create 3 dice elements
        for (let i = 0; i < 3; i++) {
            const dieElement = document.createElement('div');
            dieElement.className = 'dice';
            dieElement.dataset.diceIndex = i;
            
            // Create 6 faces for the die
            for (let face = 0; face < 6; face++) {
                const faceElement = document.createElement('div');
                faceElement.className = `face face-${face + 1}`;
                const letter = this.diceLetterMaps[i][face];
                faceElement.textContent = letter;
                dieElement.appendChild(faceElement);
            }
            
            this.diceBoxElement.appendChild(dieElement);
        }
    }

    updateDiceFaces() {
        // Update the letters on each dice face without recreating the dice
        const diceElements = this.diceBoxElement.querySelectorAll('.dice');
        
        for (let i = 0; i < diceElements.length; i++) {
            const dieElement = diceElements[i];
            const faceElements = dieElement.querySelectorAll('.face');
            
            // Update each face with the new letter assignment
            for (let face = 0; face < 6; face++) {
                const letter = this.diceLetterMaps[i][face];
                faceElements[face].textContent = letter;
            }
        }
    }

    async rollDice() {
        if (this.isRolling) return;
        
        this.isRolling = true;
        this.rollButton.disabled = true;
        this.wordDisplay.style.display = 'none';
        
        // Reassign letters to dice faces randomly for this roll
        // This happens before the roll animation so dice don't change after showing the word
        this.assignLettersToDice();
        // Update the dice faces with new letters (before rolling)
        this.updateDiceFaces();
        
        // Play dice roll sound
        this.playDiceRollSound();
        
        const diceElements = this.diceBoxElement.querySelectorAll('.dice');
        const results = [];
        
        // Roll each die
        for (let i = 0; i < diceElements.length; i++) {
            const dieElement = diceElements[i];
            const randomFace = Math.floor(Math.random() * 6) + 1; // 1-6
            results.push(randomFace);
            
            // Calculate the final rotation needed to show the selected face
            const finalRotations = this.getFaceRotation(randomFace);
            
            // Add some extra random rotations to make it look more natural
            // The animation will end at the correct rotation to show the selected face
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
        }
        
        // Wait for animation to complete (1.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Remove rolling class and explicitly set the final transform
        // This ensures the dice stay in the exact position where the animation ended
        for (let i = 0; i < diceElements.length; i++) {
            const dieElement = diceElements[i];
            const finalFace = results[i];
            
            // Calculate the final rotation needed to show the selected face
            const finalRotations = this.getFaceRotation(finalFace);
            
            // Remove rolling class
            dieElement.classList.remove('rolling');
            
            // Explicitly set the final transform to lock the dice in position
            // This prevents any transition or movement after the animation
            dieElement.style.transform = `rotateX(${finalRotations.x}deg) rotateY(${finalRotations.y}deg) rotateZ(${finalRotations.z}deg)`;
            dieElement.style.transition = 'none'; // Disable any transitions
        }
        
        // Wait 1 second after dice settle before showing word
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Extract letters based on the randomly selected face numbers
        // The dice are in random orientations, so we use the face numbers we selected
        const letters = [];
        for (let i = 0; i < results.length; i++) {
            const finalFace = results[i];
            const faceIndex = finalFace - 1; // Convert 1-6 to 0-5
            const letter = this.diceLetterMaps[i][faceIndex];
            letters.push(letter);
        }
        
        // Form word
        const word = letters.join('');
        
        // Display word
        this.displayWord(word);
        
        // Re-enable roll button
        this.isRolling = false;
        this.rollButton.disabled = false;
    }
    
    playDiceRollSound() {
        // Play dice roll sound from shared audio directory
        const audio = new Audio('../shared/static/audio/dice-142528.mp3');
        audio.play().catch((error) => {
            console.error('Error playing dice roll sound:', error);
            // Fallback: generate a simple dice roll sound if file doesn't exist
            this.generateDiceRollSound();
        });
    }
    
    generateDiceRollSound() {
        // Generate a simple dice rolling sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Create a shaking/rattling sound
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(250, audioContext.currentTime + 0.2);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        } catch (error) {
            // Silently fail if Web Audio API is not available
            console.log('Could not generate dice roll sound');
        }
    }
    
    getFaceRotation(face) {
        // Return rotation values to show each face facing the viewer (front)
        // CSS face positions:
        // face-1: Front (rotateY 0deg) - default position
        // face-2: Right (rotateY 90deg) - need rotateY(-90deg) to bring it forward
        // face-3: Top (rotateX -90deg) - need rotateX(90deg) to bring it forward
        // face-4: Bottom (rotateX 90deg) - need rotateX(-90deg) to bring it forward
        // face-5: Left (rotateY -90deg) - need rotateY(90deg) to bring it forward
        // face-6: Back (rotateY 180deg) - need rotateY(180deg) to bring it forward
        const rotations = {
            1: { x: 0, y: 0, z: 0 },       // Face 1 (Front) - no rotation needed
            2: { x: 0, y: -90, z: 0 },     // Face 2 (Right) - rotate left to show right face
            3: { x: 90, y: 0, z: 0 },      // Face 3 (Top) - rotate down to show top face
            4: { x: -90, y: 0, z: 0 },     // Face 4 (Bottom) - rotate up to show bottom face
            5: { x: 0, y: 90, z: 0 },      // Face 5 (Left) - rotate right to show left face
            6: { x: 0, y: 180, z: 0 }      // Face 6 (Back) - rotate 180 to show back face
        };
        return rotations[face] || rotations[1];
    }

    displayWord(word) {
        this.wordText.textContent = word;
        this.wordDisplay.style.display = 'block';
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
    new DiceWordGame();
    setupBackLink();
});

