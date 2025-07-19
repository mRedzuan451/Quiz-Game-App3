// js/ui.js

/**
 * Shows a specific section and hides all others.
 * @param {string} sectionId - The ID of the section to show.
 */
export const showSection = (sectionId) => {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden-section');
        section.classList.remove('active-section');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden-section');
        targetSection.classList.add('active-section');
    }
};

/**
 * Renders the authentication status (login/logout button, user email).
 * @param {firebase.User} user - The current Firebase user object or null.
 */
export const renderAuthStatus = (user) => {
    const authStatusNav = document.getElementById('auth-status');
    authStatusNav.innerHTML = ''; // Clear previous content

    if (user) {
        const userEmailSpan = document.createElement('span');
        userEmailSpan.textContent = `Logged in as: ${user.email}`;
        userEmailSpan.style.marginRight = '10px';
        authStatusNav.appendChild(userEmailSpan);

        const logoutButton = document.createElement('button');
        logoutButton.id = 'logout-btn';
        logoutButton.textContent = 'Logout';
        authStatusNav.appendChild(logoutButton);
    } else {
        // No need to show login/register buttons in nav, as login section is primary
    }
};

/**
 * Renders a question and its answer options.
 * @param {object} question - The current question object.
 * @param {boolean} isGameMasterView - True if rendering for Game Master screen, false for player.
 */
export const renderQuestion = (question, isGameMasterView) => {
    const questionTextElement = document.getElementById('current-question-text');
    const answerOptionsDiv = document.getElementById('answer-options');

    if (questionTextElement) {
        questionTextElement.textContent = question.text;
    }
    if (answerOptionsDiv) {
        answerOptionsDiv.innerHTML = ''; // Clear previous options

        question.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('answer-button');
            button.textContent = option;
            button.dataset.answer = option; // Store answer for later check

            if (!isGameMasterView) { // Players can click answers
                button.addEventListener('click', () => {
                    // Logic for answer submission will be handled in gameLogic.js
                    // This UI function just creates the button.
                });
            } else { // Game Master view shouldn't be clickable
                button.disabled = true;
                button.style.cursor = 'default';
            }
            answerOptionsDiv.appendChild(button);
        });
    }
};

/**
 * Updates the timer display.
 * @param {number} timeLeft - Remaining time in seconds.
 */
export const updateTimerDisplay = (timeLeft) => {
    const timerElement = document.getElementById('timer-display');
    if (timerElement) {
        timerElement.textContent = timeLeft;
    }
};

/**
 * Updates the player's personal score display.
 * @param {number} score - The player's current score.
 */
export const updatePlayerScoreDisplay = (score) => {
    const playerScoreElement = document.getElementById('player-score');
    if (playerScoreElement) {
        playerScoreElement.textContent = score;
    }
};

/**
 * Renders the list of players in the game master's lobby.
 * @param {object} players - Object of players from Firebase (e.g., {uid: {name: '...', score: 0}}).
 */
export const renderGameMasterPlayerList = (players) => {
    const playerListUl = document.getElementById('game-master-player-list');
    if (playerListUl) {
        playerListUl.innerHTML = '';
        for (const playerId in players) {
            const player = players[playerId];
            const li = document.createElement('li');
            li.textContent = `${player.name} (Score: ${player.score})`;
            playerListUl.appendChild(li);
        }
    }
};

/**
 * Renders the final scoreboard.
 * @param {object} players - Object of players from Firebase.
 */
export const renderFinalScoreboard = (players) => {
    const scoreboardList = document.getElementById('final-scoreboard-list');
    if (scoreboardList) {
        scoreboardList.innerHTML = '';
        const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
        sortedPlayers.forEach((player, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${player.name} - ${player.score} points`;
            scoreboardList.appendChild(li);
        });
    }
};

/**
 * Highlights an answer button (e.g., green for correct, red for incorrect).
 * @param {string} selectedAnswer - The answer that was selected by the player.
 * @param {string} correctAnswer - The actual correct answer.
 */
export const highlightAnswer = (selectedAnswer, correctAnswer) => {
    const buttons = document.querySelectorAll('#answer-options .answer-button');
    buttons.forEach(button => {
        if (button.dataset.answer === correctAnswer) {
            button.classList.add('correct');
        } else if (button.dataset.answer === selectedAnswer) {
            button.classList.add('incorrect');
        }
        button.disabled = true; // Disable all buttons after an answer is chosen
    });
};

/**
 * Resets the answer buttons for a new question.
 */
export const resetAnswerButtons = () => {
    const buttons = document.querySelectorAll('#answer-options .answer-button');
    buttons.forEach(button => {
        button.classList.remove('correct', 'incorrect');
        button.disabled = false;
    });
};