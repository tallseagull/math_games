// Number Series Puzzle Game
const SERIES_COUNT = 10;

// Store series data
let seriesData = {};

// Generate random integer in range [min, max] inclusive
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check if a series is within bounds (1 to 200)
function isSeriesValid(series) {
    const allNumbers = [...series.series, ...series.answers];
    return allNumbers.every(num => num >= 1 && num <= 200);
}

// Generate a single number series
function generateSeries() {
    const ruleTypes = [
        'arithmetic_constant',
        'arithmetic_variable',
        'geometric_constant',
        'positional_powers',
        'positional_powers_offset',
        'recursive_fibonacci',
        'mixed_operations',
        'alternating_operations'
    ];
    
    let series;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
        const ruleType = ruleTypes[randomInt(0, ruleTypes.length - 1)];
        
        switch (ruleType) {
            case 'arithmetic_constant':
                series = generateArithmeticConstant();
                break;
            case 'arithmetic_variable':
                series = generateArithmeticVariable();
                break;
            case 'geometric_constant':
                series = generateGeometricConstant();
                break;
            case 'positional_powers':
                series = generatePositionalPowers();
                break;
            case 'positional_powers_offset':
                series = generatePositionalPowersOffset();
                break;
            case 'recursive_fibonacci':
                series = generateRecursiveFibonacci();
                break;
            case 'mixed_operations':
                series = generateMixedOperations();
                break;
            case 'alternating_operations':
                series = generateAlternatingOperations();
                break;
            default:
                series = generateArithmeticConstant();
        }
        attempts++;
    } while (!isSeriesValid(series) && attempts < maxAttempts);
    
    // If we couldn't generate a valid series after max attempts, return a simple arithmetic one
    if (!isSeriesValid(series)) {
        return generateSimpleArithmetic();
    }
    
    return series;
}

// Fallback function for simple arithmetic series
function generateSimpleArithmetic() {
    const start = randomInt(1, 50);
    const difference = randomInt(1, 10);
    const length = 5;
    const series = [];
    
    for (let i = 0; i < length; i++) {
        series.push(start + (i * difference));
    }
    
    const next1 = series[series.length - 1] + difference;
    const next2 = next1 + difference;
    
    return {
        series: series,
        answers: [next1, next2],
        rule: `Add ${difference} each time`,
        ruleType: 'arithmetic_constant'
    };
}

// 1. Arithmetic Progressions - Constant Difference
function generateArithmeticConstant() {
    const start = randomInt(1, 100);
    const difference = randomInt(1, 15); // Only positive differences to avoid negatives
    const length = randomInt(5, 7);
    const series = [];
    
    for (let i = 0; i < length; i++) {
        series.push(start + (i * difference));
    }
    
    const next1 = series[series.length - 1] + difference;
    const next2 = next1 + difference;
    
    return {
        series: series,
        answers: [next1, next2],
        rule: `Add ${difference} each time`,
        ruleType: 'arithmetic_constant'
    };
}

// 2. Arithmetic Progressions - Variable Difference
function generateArithmeticVariable() {
    const start = randomInt(1, 50);
    const length = randomInt(5, 7);
    const series = [start];
    
    // Generate variable differences (smaller to stay within bounds)
    const differences = [];
    for (let i = 0; i < length + 1; i++) {
        differences.push(randomInt(1, 8));
    }
    
    for (let i = 1; i < length; i++) {
        series.push(series[i - 1] + differences[i - 1]);
    }
    
    const next1 = series[series.length - 1] + differences[length - 1];
    const next2 = next1 + differences[length];
    
    return {
        series: series,
        answers: [next1, next2],
        rule: `Variable differences: ${differences.slice(0, length).join(', ')}`,
        ruleType: 'arithmetic_variable'
    };
}

// 3. Geometric Progressions - Constant Ratio
function generateGeometricConstant() {
    const start = randomInt(2, 8);
    const ratio = randomInt(2, 3); // Smaller ratio to stay within bounds
    const length = randomInt(5, 6); // Shorter length for geometric
    const series = [];
    
    for (let i = 0; i < length; i++) {
        series.push(start * Math.pow(ratio, i));
    }
    
    const next1 = series[series.length - 1] * ratio;
    const next2 = next1 * ratio;
    
    return {
        series: series,
        answers: [next1, next2],
        rule: `Multiply by ${ratio} each time`,
        ruleType: 'geometric_constant'
    };
}

// 4. Positional Rules - Powers
function generatePositionalPowers() {
    const power = randomInt(2, 3); // Only squares and cubes to stay within bounds
    const length = randomInt(5, 6); // Shorter length for powers
    const series = [];
    
    for (let i = 1; i <= length; i++) {
        series.push(Math.pow(i, power));
    }
    
    const next1 = Math.pow(length + 1, power);
    const next2 = Math.pow(length + 2, power);
    
    const powerNames = { 2: 'square', 3: 'cube' };
    
    return {
        series: series,
        answers: [next1, next2],
        rule: `The ${powerNames[power]} of the position (n^${power})`,
        ruleType: 'positional_powers'
    };
}

// 5. Positional Rules - Powers with Offset
function generatePositionalPowersOffset() {
    const power = randomInt(2, 3);
    const offset = randomInt(0, 10); // Only positive offsets to avoid negatives
    const length = randomInt(5, 6); // Shorter length
    const series = [];
    
    for (let i = 1; i <= length; i++) {
        series.push(Math.pow(i, power) + offset);
    }
    
    const next1 = Math.pow(length + 1, power) + offset;
    const next2 = Math.pow(length + 2, power) + offset;
    
    const powerNames = { 2: 'square', 3: 'cube' };
    
    return {
        series: series,
        answers: [next1, next2],
        rule: `The ${powerNames[power]} of the position + ${offset} (n^${power} + ${offset})`,
        ruleType: 'positional_powers_offset'
    };
}

// 6. Recursive Rules - Fibonacci-style
function generateRecursiveFibonacci() {
    const start1 = randomInt(1, 5); // Smaller starting numbers
    const start2 = randomInt(1, 5);
    const length = randomInt(5, 6); // Shorter length
    const series = [start1, start2];
    
    for (let i = 2; i < length; i++) {
        series.push(series[i - 1] + series[i - 2]);
    }
    
    const next1 = series[series.length - 1] + series[series.length - 2];
    const next2 = next1 + series[series.length - 1];
    
    return {
        series: series,
        answers: [next1, next2],
        rule: `Each number is the sum of the two previous numbers`,
        ruleType: 'recursive_fibonacci'
    };
}

// 7. Mixed Operations
function generateMixedOperations() {
    const start = randomInt(2, 15); // Smaller starting number
    const length = randomInt(5, 6); // Shorter length
    const series = [start];
    
    // Choose operation type
    const operationType = randomInt(1, 2);
    
    if (operationType === 1) {
        // Multiply by 2, then add 1
        for (let i = 1; i < length; i++) {
            series.push(series[i - 1] * 2 + 1);
        }
        const next1 = series[series.length - 1] * 2 + 1;
        const next2 = next1 * 2 + 1;
        
        return {
            series: series,
            answers: [next1, next2],
            rule: `Multiply by 2, then add 1`,
            ruleType: 'mixed_operations'
        };
    } else {
        // Multiply by 2, then subtract 1
        for (let i = 1; i < length; i++) {
            series.push(series[i - 1] * 2 - 1);
        }
        const next1 = series[series.length - 1] * 2 - 1;
        const next2 = next1 * 2 - 1;
        
        return {
            series: series,
            answers: [next1, next2],
            rule: `Multiply by 2, then subtract 1`,
            ruleType: 'mixed_operations'
        };
    }
}

// 8. Alternating Operations
function generateAlternatingOperations() {
    const start = randomInt(5, 15); // Smaller starting number
    const length = randomInt(5, 6); // Shorter length
    const series = [start];
    
    // Choose alternating pattern
    const pattern = randomInt(1, 2);
    
    if (pattern === 1) {
        // Add 2, then add 1 (avoiding subtraction to prevent negatives)
        for (let i = 1; i < length; i++) {
            if (i % 2 === 1) {
                series.push(series[i - 1] + 2);
            } else {
                series.push(series[i - 1] + 1);
            }
        }
        const next1 = series[series.length - 1] + (length % 2 === 1 ? 2 : 1);
        const next2 = next1 + (length % 2 === 0 ? 2 : 1);
        
        return {
            series: series,
            answers: [next1, next2],
            rule: `Add 2, then add 1, alternating`,
            ruleType: 'alternating_operations'
        };
    } else {
        // Multiply by 2, then add 2
        for (let i = 1; i < length; i++) {
            if (i % 2 === 1) {
                series.push(series[i - 1] * 2);
            } else {
                series.push(series[i - 1] + 2);
            }
        }
        const next1 = series[series.length - 1] * (length % 2 === 1 ? 2 : 1) + (length % 2 === 0 ? 2 : 0);
        const next2 = next1 * (length % 2 === 0 ? 2 : 1) + (length % 2 === 1 ? 2 : 0);
        
        return {
            series: series,
            answers: [next1, next2],
            rule: `Multiply by 2, then add 2, alternating`,
            ruleType: 'alternating_operations'
        };
    }
}

// Generate HTML for a single series
function createSeriesHTML(series, seriesId) {
    const seriesNumbers = series.series.map(num => `<span class="series-number">${num}</span>`).join(', ');
    
    return `
        <div class="series-card" id="series-${seriesId}">
            <h3>Series ${seriesId}</h3>
            <div class="series-display">
                ${seriesNumbers}, 
                <input type="number" class="answer-input" id="answer1-${seriesId}" placeholder="?">
                , 
                <input type="number" class="answer-input" id="answer2-${seriesId}" placeholder="?">
            </div>
            <div class="button-container">
                <button class="submit-btn" onclick="checkSeries(${seriesId})">Submit</button>
                <button class="show-rule-btn" onclick="showRule(${seriesId})">Show Rule</button>
            </div>
            <div id="result-${seriesId}" class="result-container"></div>
            <div id="rule-${seriesId}" class="rule-display" style="display: none;">
                <strong>Rule:</strong> ${series.rule}
            </div>
        </div>
    `;
}

// Generate all series and display them
function generateAllSeries() {
    seriesData = {};
    let seriesHTML = '';
    
    for (let i = 1; i <= SERIES_COUNT; i++) {
        const series = generateSeries();
        seriesData[i] = series;
        seriesHTML += createSeriesHTML(series, i);
    }
    
    document.getElementById('seriesContainer').innerHTML = seriesHTML;
}

// Check series solution
function checkSeries(seriesId) {
    const series = seriesData[seriesId];
    const answer1 = parseInt(document.getElementById(`answer1-${seriesId}`).value);
    const answer2 = parseInt(document.getElementById(`answer2-${seriesId}`).value);
    const resultDiv = document.getElementById(`result-${seriesId}`);
    
    if (isNaN(answer1) || isNaN(answer2)) {
        resultDiv.innerHTML = '<div class="result-message result-error">Please enter both numbers!</div>';
        return;
    }
    
    const isCorrect = (answer1 === series.answers[0] && answer2 === series.answers[1]);
    
    if (isCorrect) {
        resultDiv.innerHTML = '<div class="result-message result-correct">✓ Correct! Well done!</div>';
        // Disable inputs and button
        document.getElementById(`answer1-${seriesId}`).disabled = true;
        document.getElementById(`answer2-${seriesId}`).disabled = true;
        document.querySelector(`#series-${seriesId} .submit-btn`).disabled = true;
    } else {
        resultDiv.innerHTML = '<div class="result-message result-incorrect">✗ Incorrect. Try again!</div>';
    }
}

// Show rule for a series
function showRule(seriesId) {
    const ruleDiv = document.getElementById(`rule-${seriesId}`);
    const showBtn = document.querySelector(`#series-${seriesId} .show-rule-btn`);
    
    if (ruleDiv.style.display === 'none') {
        ruleDiv.style.display = 'block';
        showBtn.textContent = 'Hide Rule';
        showBtn.onclick = () => hideRule(seriesId);
    } else {
        ruleDiv.style.display = 'none';
        showBtn.textContent = 'Show Rule';
        showBtn.onclick = () => showRule(seriesId);
    }
}

// Hide rule for a series
function hideRule(seriesId) {
    const ruleDiv = document.getElementById(`rule-${seriesId}`);
    const showBtn = document.querySelector(`#series-${seriesId} .show-rule-btn`);
    
    ruleDiv.style.display = 'none';
    showBtn.textContent = 'Show Rule';
    showBtn.onclick = () => showRule(seriesId);
}

// Generate new series
function generateNewSeries() {
    generateAllSeries();
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', function() {
    generateAllSeries();
});
