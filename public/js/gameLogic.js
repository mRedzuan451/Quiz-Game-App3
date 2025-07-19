// js/gameLogic.js
import { getGameRef, fetchQuestions, updatePlayerScore, setPlayerAnsweredStatus } from './firebaseService.js';
import { renderQuestion, updateTimerDisplay, updatePlayerScoreDisplay, renderGameMasterPlayerList, showSection, highlightAnswer, resetAnswerButtons, renderFinalScoreboard } from './ui.js';

let gameId = null;
let currentQuestion = null;
let timerInterval = null;
let timeRemaining = 0;
let gameMasterMode = false; // To differentiate UI/logic for GM
let gameSettings = {};
let allQuestions = []; // All questions for the current game

/**
 * Initializes a new game for the Game Master.
 * @param {string} newGameId - The ID of the newly created game.
 * @param {object} settings - Game settings (mode, questionCount, timePerQuestion, displayOption).
 * @param {Array} questions - The questions fetched for this game.
 */
export const initGameMasterGame = (newGameId, settings, questions) => {
    gameId = newGameId;
    gameSettings = settings;
    allQuestions = questions;
    gameMasterMode = true;
    showSection('game-master-setup-section');
    document.getElementById('generated-game-code').textContent = gameId;

    // Listen for player joins
    getGameRef(gameId).child('players').on('value', (snapshot) => {
        const players = snapshot.val() || {};
        renderGameMasterPlayerList(players);
    });
};

/**
 * Initializes a player's game session.
 * @param {string} joinedGameId - The ID of the game the player joined.
 * @param {string} playerId - The ID of the joining player.
 */
export const initPlayerGame = (joinedGameId, playerId) => {
    gameId = joinedGameId;
    gameMasterMode = false;
    showSection('player-game-section');

    // Listen for game state changes (current question, timer)
    getGameRef(gameId).on('value', (snapshot) => {
        const gameData = snapshot.val();
        if (!gameData) {
            console.log("Game ended or does not exist.");
            // Handle game end / return to lobby
            showSection('lobby-section');
            return;
        }

        gameSettings = gameData; // Update settings in case GM changed something (unlikely in this flow)
        const currentQIndex = gameData.currentQuestionIndex;
        const playersData = gameData.players || {};

        if (gameData.status === 'active' && currentQIndex !== -1 && gameData.questions) {
            currentQuestion = gameData.questions[currentQIndex];
            renderQuestion(currentQuestion, false); // Render for player
            updateTimerDisplay(gameData.timeRemaining || gameSettings.timePerQuestion); // Or use what's in Firebase
            updatePlayerScoreDisplay(playersData[playerId]?.score || 0);
            resetAnswerButtons(); // Prepare for new question
        } else if (gameData.status === 'finished') {
            showSection('scoreboard-section');
            renderFinalScoreboard(playersData);
        } else if (gameData.status === 'waiting') {
            // Player is in lobby, waiting for GM to start
            document.getElementById('current-question-text').textContent = "Waiting for Game Master to start the game...";
            document.getElementById('answer-options').innerHTML = '';
            document.getElementById('player-score').textContent = playersData[playerId]?.score || 0;
            updateTimerDisplay(0);
        }
    });

    // Set up answer button listeners only once after rendering the player game section
    document.getElementById('answer-options').addEventListener('click', (event) => {
        if (event.target.classList.contains('answer-button')) {
            handlePlayerAnswer(event.target.dataset.answer, playerId);
        }
    });
};

/**
 * Game Master function to start the game.
 * Pushes questions to Firebase and starts the first round.
 */
export const startGame = async () => {
    if (!gameId || !gameMasterMode || !allQuestions.length) return;

    // Push questions to Firebase under the game session
    await getGameRef(gameId).child('questions').set(allQuestions);
    await getGameRef(gameId).update({ status: 'active', currentQuestionIndex: 0 });

    startQuestionTimer(0); // Start timer for the first question
};

/**
 * Handles a player's answer submission.
 * @param {string} selectedAnswer - The answer chosen by the player.
 * @param {string} playerId - The ID of the player who answered.
 */
const handlePlayerAnswer = async (selectedAnswer, playerId) => {
    if (!currentQuestion) return;

    const gameData = (await getGameRef(gameId).once('value')).val();
    if (gameData.players[playerId]?.answered) {
        console.log("Player already answered this question.");
        return; // Prevent multiple answers
    }

    const isCorrect = (selectedAnswer === currentQuestion.correct);
    let scoreEarned = 0;
    if (isCorrect) {
        scoreEarned = 100; // Basic scoring, can be enhanced with timer bonus
    }

    // Update player's score and mark as answered in Firebase
    await updatePlayerScore(gameId, playerId, scoreEarned);
    await setPlayerAnsweredStatus(gameId, playerId, true);

    highlightAnswer(selectedAnswer, currentQuestion.correct);
    console.log(`Player ${playerId} answered: ${selectedAnswer}, Correct: ${isCorrect}`);
};

/**
 * Game Master function to advance to the next question.
 */
export const nextQuestion = async () => {
    if (!gameId || !gameMasterMode) return;

    const gameData = (await getGameRef(gameId).once('value')).val();
    let nextIndex = gameData.currentQuestionIndex + 1;

    if (nextIndex < allQuestions.length) {
        // Reset 'answered' status for all players for the new question
        const playersRef = getGameRef(gameId).child('players');
        const playersSnapshot = await playersRef.once('value');
        if (playersSnapshot.exists()) {
            const updates = {};
            playersSnapshot.forEach(playerChild => {
                updates[playerChild.key + '/answered'] = false;
            });
            await playersRef.update(updates);
        }

        // Update game state in Firebase
        await getGameRef(gameId).update({ currentQuestionIndex: nextIndex });
        startQuestionTimer(nextIndex); // Start timer for the new question
    } else {
        endGame();
    }
};

/**
 * Ends the current game.
 */
export const endGame = async () => {
    if (!gameId) return;
    clearInterval(timerInterval);
    await getGameRef(gameId).update({ status: 'finished' });
    console.log("Game ended.");
    // UI will update automatically for players via Firebase listener
    // GM can transition to scoreboard immediately or wait for data sync.
    showSection('scoreboard-section');
};

/**
 * Starts or restarts the timer for the current question.
 * @param {number} questionIndex - The index of the current question.
 */
const startQuestionTimer = (questionIndex) => {
    if (timerInterval) clearInterval(timerInterval);

    timeRemaining = gameSettings.timePerQuestion; // Reset timer for new question
    updateTimerDisplay(timeRemaining); // Initial display

    // Update time in Firebase (for players to see)
    getGameRef(gameId).update({ timeRemaining: timeRemaining });

    timerInterval = setInterval(async () => {
        timeRemaining--;
        updateTimerDisplay(timeRemaining);
        // Also update Firebase so players' UI is synced
        await getGameRef(gameId).update({ timeRemaining: timeRemaining });

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            console.log("Time's up for question!");
            // Automatically advance question if GM, or just lock answers for player
            if (gameMasterMode) {
                // In a production app, you might want to wait a few seconds before nextQuestion
                // to allow players to see results or for GM to review.
                setTimeout(() => nextQuestion(), 3000); // Give 3 seconds review time
            } else {
                // For players, simply disable answering if time runs out
                document.querySelectorAll('#answer-options .answer-button').forEach(btn => btn.disabled = true);
            }
        }
    }, 1000);
};

// Expose functions if needed by main.js
export { gameId, gameMasterMode };