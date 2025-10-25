class QuizGame {
    constructor() {
        this.quizzes = [];
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.selectedAnswer = null;
        this.matchingAnswers = {}; // For matching questions
        
        this.init();
    }

    async init() {
        await this.loadQuizzes();
        this.setupEventListeners();
        this.showQuizSelection();
    }

    async loadQuizzes() {
        try {
            const response = await fetch('quizzes.yaml');
            const yamlText = await response.text();
            const data = jsyaml.load(yamlText);
            this.quizzes = data.quizzes || [];
        } catch (error) {
            console.error('Error loading quizzes:', error);
            alert('Error loading quizzes. Please check the quizzes.yaml file.');
        }
    }

    setupEventListeners() {
        document.getElementById('next-button').addEventListener('click', () => {
            this.handleNextQuestion();
        });

        document.getElementById('back-to-quizzes').addEventListener('click', () => {
            this.showQuizSelection();
        });
    }

    showQuizSelection() {
        this.hideAllScreens();
        document.getElementById('quiz-selection').classList.add('active');
        this.renderQuizList();
    }

    renderQuizList() {
        const quizList = document.getElementById('quiz-list');
        quizList.innerHTML = '';

        this.quizzes.forEach((quiz, index) => {
            const quizCard = document.createElement('div');
            quizCard.className = 'quiz-card';
            
            // Set direction based on language
            if (quiz.language === 'he' || quiz.direction === 'rtl') {
                quizCard.setAttribute('dir', 'rtl');
            }

            quizCard.innerHTML = `
                <h3>${quiz.title}</h3>
                ${quiz.description ? `<p>${quiz.description}</p>` : ''}
                <div class="quiz-meta">
                    <span>📝 ${quiz.questions.length} Questions</span>
                    ${quiz.language ? `<span>🌐 ${quiz.language.toUpperCase()}</span>` : ''}
                </div>
            `;

            quizCard.addEventListener('click', () => {
                this.startQuiz(index);
            });

            quizList.appendChild(quizCard);
        });
    }

    startQuiz(quizIndex) {
        this.currentQuiz = this.quizzes[quizIndex];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.selectedAnswer = null;
        this.matchingAnswers = {};

        // Set direction for the entire container
        const container = document.querySelector('.container');
        if (this.currentQuiz.language === 'he' || this.currentQuiz.direction === 'rtl') {
            container.setAttribute('dir', 'rtl');
        } else {
            container.setAttribute('dir', 'ltr');
        }

        this.hideAllScreens();
        document.getElementById('quiz-playing').classList.add('active');
        
        this.showQuestion();
    }

    showQuestion() {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        // Update quiz title
        document.getElementById('quiz-title').textContent = this.currentQuiz.title;
        
        // Update progress
        const progress = ((this.currentQuestionIndex + 1) / this.currentQuiz.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Update question counter
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = this.currentQuiz.questions.length;
        
        // Update question text
        const questionTextEl = document.getElementById('question-text');
        questionTextEl.textContent = question.question;
        
        // Add image if present
        const existingImage = questionTextEl.querySelector('.question-image');
        if (existingImage) {
            existingImage.remove();
        }
        
        if (question.image) {
            const imageEl = document.createElement('img');
            imageEl.src = question.image;
            imageEl.className = 'question-image';
            imageEl.alt = 'Question image';
            questionTextEl.appendChild(imageEl);
        }
        
        // Render answers based on question type
        const questionType = question.type || 'multiple-choice';
        if (questionType === 'matching') {
            this.renderMatchingQuestion(question);
        } else {
            this.renderMultipleChoiceAnswers(question.answers);
        }
        
        // Reset next button
        const nextButton = document.getElementById('next-button');
        nextButton.disabled = true;
        nextButton.textContent = this.isLastQuestion() ? 'Finish Quiz' : 'Next Question';
    }

    renderMultipleChoiceAnswers(answers) {
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';
        answersContainer.className = 'answers-container';
        this.selectedAnswer = null;

        answers.forEach((answer, index) => {
            const answerOption = document.createElement('div');
            answerOption.className = 'answer-option';
            answerOption.textContent = answer;
            
            answerOption.addEventListener('click', () => {
                if (!answerOption.classList.contains('disabled')) {
                    this.selectAnswer(index);
                }
            });

            answersContainer.appendChild(answerOption);
        });
    }

    renderMatchingQuestion(question) {
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';
        answersContainer.className = 'matching-container';
        this.matchingAnswers = {};

        const leftItems = question.left_items || [];
        const rightItems = question.right_items || [];

        leftItems.forEach((leftItem, index) => {
            const matchingRow = document.createElement('div');
            matchingRow.className = 'matching-row';

            const leftItemEl = document.createElement('div');
            leftItemEl.className = 'matching-left-item';
            leftItemEl.textContent = leftItem;

            const selectWrapper = document.createElement('div');
            selectWrapper.className = 'matching-select-wrapper';

            const select = document.createElement('select');
            select.className = 'matching-select';
            select.dataset.leftIndex = index;

            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Select --';
            select.appendChild(defaultOption);

            // Add right items as options
            rightItems.forEach((rightItem, rightIndex) => {
                const option = document.createElement('option');
                option.value = rightIndex;
                option.textContent = rightItem;
                select.appendChild(option);
            });

            select.addEventListener('change', () => {
                this.handleMatchingSelection(index, select.value);
            });

            selectWrapper.appendChild(select);
            matchingRow.appendChild(leftItemEl);
            matchingRow.appendChild(selectWrapper);
            answersContainer.appendChild(matchingRow);
        });
    }

    handleMatchingSelection(leftIndex, rightIndex) {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const selects = document.querySelectorAll('.matching-select');
        
        if (rightIndex === '') {
            delete this.matchingAnswers[leftIndex];
        } else {
            this.matchingAnswers[leftIndex] = parseInt(rightIndex);
        }

        // Update all selects to disable already selected options
        selects.forEach(select => {
            const currentLeftIndex = parseInt(select.dataset.leftIndex);
            const currentValue = select.value;
            
            Array.from(select.options).forEach(option => {
                if (option.value === '') return;
                
                const optionValue = parseInt(option.value);
                const isSelectedElsewhere = Object.entries(this.matchingAnswers).some(
                    ([leftIdx, rightIdx]) => parseInt(leftIdx) !== currentLeftIndex && rightIdx === optionValue
                );
                
                option.disabled = isSelectedElsewhere;
            });
            
            // Restore current selection
            select.value = currentValue;
        });

        // Enable next button if all matches are made
        const allMatched = Object.keys(this.matchingAnswers).length === question.left_items.length;
        document.getElementById('next-button').disabled = !allMatched;
    }

    selectAnswer(answerIndex) {
        // Remove previous selection
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select new answer
        const answerOptions = document.querySelectorAll('.answer-option');
        answerOptions[answerIndex].classList.add('selected');
        this.selectedAnswer = answerIndex;

        // Enable next button
        document.getElementById('next-button').disabled = false;
    }

    handleNextQuestion() {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const questionType = question.type || 'multiple-choice';

        if (questionType === 'matching') {
            this.handleMatchingAnswer();
        } else {
            this.handleMultipleChoiceAnswer();
        }
    }

    handleMultipleChoiceAnswer() {
        if (this.selectedAnswer === null) {
            return;
        }

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === question.correct;

        // Record answer
        this.userAnswers.push({
            type: 'multiple-choice',
            question: question.question,
            image: question.image,
            userAnswer: question.answers[this.selectedAnswer],
            correctAnswer: question.answers[question.correct],
            isCorrect: isCorrect
        });

        if (isCorrect) {
            this.score++;
        }

        // Show feedback
        this.showMultipleChoiceFeedback(isCorrect);

        // Move to next question or show results
        setTimeout(() => {
            if (this.isLastQuestion()) {
                this.showResults();
            } else {
                this.currentQuestionIndex++;
                this.showQuestion();
            }
        }, 1000);
    }

    handleMatchingAnswer() {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const correctMatches = question.correct_matches || {};
        
        let correctCount = 0;
        const matchDetails = {};

        question.left_items.forEach((leftItem, leftIndex) => {
            const userRightIndex = this.matchingAnswers[leftIndex];
            const correctRightIndex = correctMatches[leftIndex];
            const isCorrect = userRightIndex === correctRightIndex;
            
            if (isCorrect) correctCount++;
            
            matchDetails[leftItem] = {
                userAnswer: question.right_items[userRightIndex],
                correctAnswer: question.right_items[correctRightIndex],
                isCorrect: isCorrect
            };
        });

        const isFullyCorrect = correctCount === question.left_items.length;

        // Record answer
        this.userAnswers.push({
            type: 'matching',
            question: question.question,
            image: question.image,
            matchDetails: matchDetails,
            isCorrect: isFullyCorrect,
            score: `${correctCount}/${question.left_items.length}`
        });

        if (isFullyCorrect) {
            this.score++;
        }

        // Show feedback
        this.showMatchingFeedback(matchDetails);

        // Move to next question or show results
        setTimeout(() => {
            if (this.isLastQuestion()) {
                this.showResults();
            } else {
                this.currentQuestionIndex++;
                this.showQuestion();
            }
        }, 2000);
    }

    showMultipleChoiceFeedback(isCorrect) {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const answerOptions = document.querySelectorAll('.answer-option');

        answerOptions.forEach((option, index) => {
            option.classList.add('disabled');
            
            if (index === question.correct) {
                option.classList.add('correct');
            } else if (index === this.selectedAnswer && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        document.getElementById('next-button').disabled = true;
    }

    showMatchingFeedback(matchDetails) {
        const matchingRows = document.querySelectorAll('.matching-row');
        const selects = document.querySelectorAll('.matching-select');
        
        selects.forEach(select => {
            select.disabled = true;
        });

        Object.entries(matchDetails).forEach(([leftItem, details], index) => {
            const row = matchingRows[index];
            if (details.isCorrect) {
                row.classList.add('correct');
            } else {
                row.classList.add('incorrect');
                
                // Show correct answer
                const correctAnswerEl = document.createElement('div');
                correctAnswerEl.className = 'correct-answer-hint';
                correctAnswerEl.textContent = `✓ ${details.correctAnswer}`;
                row.appendChild(correctAnswerEl);
            }
        });

        document.getElementById('next-button').disabled = true;
    }

    isLastQuestion() {
        return this.currentQuestionIndex === this.currentQuiz.questions.length - 1;
    }

    showResults() {
        this.hideAllScreens();
        document.getElementById('results').classList.add('active');

        const totalQuestions = this.currentQuiz.questions.length;
        const percentage = Math.round((this.score / totalQuestions) * 100);

        document.getElementById('score').textContent = this.score;
        document.getElementById('total').textContent = totalQuestions;
        document.getElementById('percentage').textContent = `${percentage}%`;

        // Show detailed results
        this.renderResultsSummary();
    }

    renderResultsSummary() {
        const summaryContainer = document.getElementById('results-summary');
        summaryContainer.innerHTML = '<h3 style="margin-bottom: 20px; color: #333;">Review Your Answers</h3>';

        this.userAnswers.forEach((answer, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            if (answer.type === 'matching') {
                this.renderMatchingResult(resultItem, answer, index);
            } else {
                this.renderMultipleChoiceResult(resultItem, answer, index);
            }

            summaryContainer.appendChild(resultItem);
        });
    }

    renderMultipleChoiceResult(resultItem, answer, index) {
        const statusIcon = answer.isCorrect ? '✓' : '✗';
        const statusClass = answer.isCorrect ? 'correct' : 'incorrect';

        resultItem.innerHTML = `
            <div class="result-question">${index + 1}. ${answer.question}</div>
            ${answer.image ? `<img src="${answer.image}" class="result-image" alt="Question image">` : ''}
            <div class="result-answer ${statusClass}">
                ${statusIcon} Your answer: ${answer.userAnswer}
            </div>
            ${!answer.isCorrect ? `
                <div class="result-answer correct">
                    ✓ Correct answer: ${answer.correctAnswer}
                </div>
            ` : ''}
        `;
    }

    renderMatchingResult(resultItem, answer, index) {
        const statusIcon = answer.isCorrect ? '✓' : '✗';
        const statusClass = answer.isCorrect ? 'correct' : 'incorrect';

        let matchDetailsHTML = '<div class="matching-result-details">';
        Object.entries(answer.matchDetails).forEach(([leftItem, details]) => {
            const itemStatus = details.isCorrect ? 'correct' : 'incorrect';
            matchDetailsHTML += `
                <div class="matching-result-item ${itemStatus}">
                    <strong>${leftItem}</strong> → ${details.userAnswer}
                    ${!details.isCorrect ? `<br><span class="correct-hint">✓ Correct: ${details.correctAnswer}</span>` : ''}
                </div>
            `;
        });
        matchDetailsHTML += '</div>';

        resultItem.innerHTML = `
            <div class="result-question">${index + 1}. ${answer.question}</div>
            ${answer.image ? `<img src="${answer.image}" class="result-image" alt="Question image">` : ''}
            <div class="result-answer ${statusClass}">
                ${statusIcon} Your score: ${answer.score}
            </div>
            ${matchDetailsHTML}
        `;
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizGame();
});
