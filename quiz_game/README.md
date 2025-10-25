# Multiple Choice Quiz Game

A flexible quiz game that supports multiple quizzes with RTL (Right-to-Left) and LTR (Left-to-Right) languages, including Hebrew support.

## Features

- 📝 **Two Question Types**:
  - Multiple choice questions with 4 options
  - Matching questions with dropdown selection
- 🖼️ **Image Support**: Add optional images to any question
- 🌐 **RTL/LTR Languages**: Full support for Hebrew (RTL) and English (LTR)
- 📊 **Score Tracking**: Detailed results with answer review
- 🎨 **Beautiful UI**: Modern design with smooth animations
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- ✅ **Smart Feedback**: 
  - Color-coded correct/incorrect answers
  - For matching: shows which pairs were correct/incorrect
- 🚫 **Smart Dropdown**: Selected options become unavailable for other selections
- 📈 **Progress Tracking**: Visual progress bar and question counter

## How to Use

1. Open `index.html` in a web browser
2. Select a quiz from the available options
3. Answer each question by clicking on your choice
4. Click "Next Question" to proceed
5. View your final score and review your answers

## Adding New Quizzes

Quizzes are stored in the `quizzes.yaml` file. The game supports two types of questions:

### 1. Multiple Choice Questions (Default)

```yaml
quizzes:
  - title: Quiz Title
    description: Quiz description (optional)
    language: en  # or 'he' for Hebrew
    direction: ltr  # or 'rtl' for Hebrew
    questions:
      - type: multiple-choice  # Optional, this is the default
        question: Your question here?
        image: path/to/image.jpg  # Optional: add an image to the question
        answers:
          - First answer option
          - Second answer option
          - Third answer option
          - Fourth answer option
        correct: 2  # Index of correct answer (0-based)
```

### 2. Matching Questions

Match items from one list to another using dropdowns. Once an option is selected, it becomes unavailable for other selections.

```yaml
- type: matching
  question: Match each item on the left with its match on the right
  image: path/to/image.jpg  # Optional: add an image to the question
  left_items:
    - Item A
    - Item B
    - Item C
  right_items:
    - Match 1
    - Match 2
    - Match 3
  correct_matches:
    0: 2  # Item A (index 0) matches with Match 3 (index 2)
    1: 0  # Item B (index 1) matches with Match 1 (index 0)
    2: 1  # Item C (index 2) matches with Match 2 (index 1)
```

### Tips for Creating Quizzes

- **Title**: A descriptive name for your quiz
- **Description**: Optional brief explanation of the quiz topic
- **Language**: Use 'en' for English, 'he' for Hebrew, or other language codes
- **Direction**: Use 'ltr' for left-to-right languages (English), 'rtl' for right-to-left languages (Hebrew, Arabic)
- **Type**: Either 'multiple-choice' (default) or 'matching'
- **Image**: (Optional) Path to an image file to display with the question
- **Questions**: Array of question objects

#### For Multiple Choice Questions:
- **Answers**: Array of 4 answer options
- **Correct**: Zero-based index of the correct answer (0 = first answer, 1 = second, 2 = third, 3 = fourth)

#### For Matching Questions:
- **left_items**: Array of items on the left side to be matched
- **right_items**: Array of items on the right side (answer options)
- **correct_matches**: Object mapping left item indices to right item indices

### Example Quizzes

#### Hebrew Multiple Choice Quiz

```yaml
- title: קוויז ידע כללי
  description: בדקו את הידע הכללי שלכם
  language: he
  direction: rtl
  questions:
    - question: מהי בירת ישראל?
      answers:
        - תל אביב
        - חיפה
        - ירושלים
        - באר שבע
      correct: 2
```

#### Quiz with Images

```yaml
- title: Animals Quiz
  description: Identify animals from pictures
  language: en
  direction: ltr
  questions:
    - type: multiple-choice
      question: What animal is shown in this image?
      image: ../shared/static/images/cat.jpg
      answers:
        - Dog
        - Cat
        - Duck
        - Rabbit
      correct: 1
```

#### Matching Quiz (English)

```yaml
- title: Geography & Capitals
  description: Match countries with their capitals
  language: en
  direction: ltr
  questions:
    - type: matching
      question: Match each country with its capital city
      left_items:
        - France
        - Japan
        - Egypt
        - Brazil
      right_items:
        - Cairo
        - Brasília
        - Tokyo
        - Paris
      correct_matches:
        0: 3  # France → Paris
        1: 2  # Japan → Tokyo
        2: 0  # Egypt → Cairo
        3: 1  # Brazil → Brasília
```

#### Matching Quiz (Hebrew/RTL)

```yaml
- title: התאמת מילים
  description: התאימו מילים
  language: he
  direction: rtl
  questions:
    - type: matching
      question: התאימו בין המספרים לשמותיהם
      left_items:
        - אחד
        - שניים
        - שלושה
      right_items:
        - "3"
        - "1"
        - "2"
      correct_matches:
        0: 1  # אחד → 1
        1: 2  # שניים → 2
        2: 0  # שלושה → 3
```

## Technical Details

- **YAML Parser**: Uses js-yaml library for parsing quiz data
- **RTL Support**: Automatically detects language and applies appropriate text direction
- **Responsive**: Works on desktop, tablet, and mobile devices
- **No Backend Required**: Pure frontend implementation using HTML, CSS, and JavaScript

## File Structure

```
quiz_game/
├── index.html      # Main HTML file
├── script.js       # Game logic and functionality
├── styles.css      # Styling with RTL/LTR support
├── quizzes.yaml    # Quiz data storage
└── README.md       # This file
```

## Browser Compatibility

This game works in all modern browsers that support:
- ES6 JavaScript
- CSS Flexbox and Grid
- Fetch API

Tested in Chrome, Firefox, Safari, and Edge.

