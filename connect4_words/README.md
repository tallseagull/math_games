# Connect 4 Words

A two-player word game that combines vocabulary practice with classic Connect 4 or Tic-Tac-Toe gameplay.

## How to Play

### Game Setup
1. Choose your game mode:
   - **Tic-Tac-Toe** (3x3 grid - Connect 3 to win)
   - **Connect 4** (6x7 grid - Connect 4 to win)

### Gameplay
1. **Two players** take turns: Yellow goes first, then Red
2. The game displays a grid filled with random English words
3. On your turn:
   - Read the word you want to claim
   - Explain its meaning to the other player
   - If correct, click the cell to claim it with your color
   - If you don't know the word or make a mistake, click **"Pass Turn"** to skip
4. After claiming a cell, the turn automatically switches to the other player
5. First player to get the required number of cells in a row (horizontally, vertically, or diagonally) wins!

### Winning
- **Tic-Tac-Toe**: Get 3 circles of your color in a row
- **Connect 4**: Get 4 circles of your color in a row
- Winning cells are highlighted with larger, pulsing circles
- Click **"New Game"** to play again with new words
- Click **"Change Mode"** to switch between Tic-Tac-Toe and Connect 4

## Customization

### Adding Your Own Words
Edit the `words.json` file to customize the word list:

```json
{
  "words": [
    "apple",
    "banana",
    "cat",
    "your-word-here"
  ]
}
```

**Tips for word selection:**
- Use words appropriate for the players' vocabulary level
- Mix easier and harder words for variety
- Include at least 42 words for Connect 4 mode (6×7 = 42 cells)
- Include at least 9 words for Tic-Tac-Toe mode (3×3 = 9 cells)
- For best experience, have 50+ words so each game has variety

### Modifying Grid Sizes
The game currently supports:
- **3×3 grid** (Tic-Tac-Toe, connect 3)
- **6×7 grid** (Connect 4, connect 4)

To add custom grid sizes, modify the mode buttons in `index.html`:
```html
<button class="mode-button" data-rows="4" data-cols="5" data-connect="3">
    Custom Mode<br><span class="mode-subtitle">(4x5 - Connect 3)</span>
</button>
```

Attributes:
- `data-rows`: Number of rows in the grid
- `data-cols`: Number of columns in the grid
- `data-connect`: How many in a row needed to win

## Features

- ✅ Two game modes: Tic-Tac-Toe and Connect 4
- ✅ Configurable grid sizes
- ✅ Random word selection each game
- ✅ Visual player indicator
- ✅ Pass turn functionality
- ✅ Automatic win detection (horizontal, vertical, diagonal)
- ✅ Winning cell highlighting with animation
- ✅ New game and mode change options
- ✅ Fully responsive design for mobile and desktop
- ✅ Beautiful modern UI with smooth animations

## Educational Benefits

- **Vocabulary Building**: Players learn new words and their meanings
- **Verbal Communication**: Players practice explaining concepts
- **Strategic Thinking**: Plan moves to win while blocking opponent
- **Turn Taking**: Develops patience and fair play
- **Pattern Recognition**: Identify winning positions

## Technical Details

### Files
- `index.html` - Game structure and layout
- `script.js` - Game logic, win detection, and state management
- `styles.css` - Styling and animations
- `words.json` - Configurable word list

### Browser Compatibility
Works on all modern browsers (Chrome, Firefox, Safari, Edge)

### No Installation Required
Simply open `index.html` in a web browser to play!

## Tips for Players

1. **Take your time**: Think about which cell gives you the best position
2. **Block your opponent**: Watch for their potential winning moves
3. **Learn together**: Use this as an opportunity to teach and learn new words
4. **Be honest**: This game works on the honor system - be truthful about word knowledge
5. **Have fun**: The goal is to learn and enjoy!

## Future Enhancement Ideas

- [ ] Add difficulty levels with different word sets
- [ ] Add a dictionary API integration for automatic word validation
- [ ] Add score tracking across multiple games
- [ ] Add timer option for faster-paced games
- [ ] Add sound effects for moves and wins
- [ ] Add option for computer player (AI opponent)
- [ ] Add word categories/themes
- [ ] Add multilingual support

