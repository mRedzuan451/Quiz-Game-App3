// js/main.js
import { onAuthStateChanged, loginUser, registerUser, logoutUser } from './auth.js';
import { showSection, renderAuthStatus, renderGameMasterPlayerList } from './ui.js';
import { createGameSession, joinGameSession, fetchQuestions, getGameRef } from './firebaseService.js';
import { initGameMasterGame, initPlayerGame, startGame, nextQuestion, endGame } from './gameLogic.js';

// Global state for current user
let currentUser = null;

// --- Event Listeners ---

// Authentication Forms
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await loginUser(email, password);
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('register-btn').addEventListener('click', async () => {
    const email = prompt("Enter email for registration:");
    const password = prompt("Enter password (min 6 characters):");
    if (email && password) {
        try {
            await registerUser(email, password, email.split('@')[0]); // Use email prefix as default username
            alert("Registration successful! Please login.");
        } catch (error) {
            alert(error.message);
        }
    }
});

// Logout Button (dynamic, handled by UI module)
document.getElementById('auth-status').addEventListener('click', (e) => {
    if (e.target.id === 'logout-btn') {
        logoutUser().catch(error => alert(error.message));
    }
});

// Game Lobby Buttons
document.getElementById('create-game-btn').addEventListener('click', () => {
    showSection('game-master-setup-section');
});

document.getElementById('join-game-btn').addEventListener('click', async () => {
    const gameCode = document.getElementById('game-code-input').value.trim();
    if (gameCode && currentUser) {
        try {
            // Check if game exists and is joinable
            const gameSnapshot = await getGameRef(gameCode).once('value');
            if (gameSnapshot.exists() && gameSnapshot.val().status === 'waiting') {
                await joinGameSession(gameCode, currentUser.uid, currentUser.displayName || currentUser.email);
                initPlayerGame(gameCode, currentUser.uid);
                alert(`Joined game ${gameCode}! Waiting for Game Master to start.`);
            } else {
                alert("Game not found or not joinable.");
            }
        } catch (error) {
            console.error("Error joining game:", error);
            alert("Failed to join game: " + error.message);
        }
    } else {
        alert("Please enter a game code and be logged in.");
    }
});


// Game Master Setup Form
document.getElementById('game-setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const gameMode = document.getElementById('game-mode').value;
    const questionCount = parseInt(document.getElementById('question-count').value);
    const timePerQuestion = parseInt(document.getElementById('time-per-question').value);
    const displayOption = document.getElementById('display-option').value;

    if (!currentUser) {
        alert("You must be logged in to create a game.");
        return;
    }

    try {
        const questions = await fetchQuestions(gameMode, questionCount);
        if (questions.length === 0) {
            alert("Could not fetch questions for the selected mode. Please try again.");
            return;
        }

        const gameSettings = { gameMode, questionCount, timePerQuestion, displayOption };
        const newGameId = await createGameSession(gameSettings);

        // Add game master to players
        await joinGameSession(newGameId, currentUser.uid, currentUser.displayName || currentUser.email + " (GM)");

        initGameMasterGame(newGameId, gameSettings, questions);
        // Game Master will then manually click 'Start Game'
        alert(`Game created! Share this code: ${newGameId}`);

        // For GM, attach button listener to start the game
        const startGameButton = document.createElement('button');
        startGameButton.textContent = 'Start Game';
        startGameButton.id = 'gm-start-game-btn';
        startGameButton.addEventListener('click', startGame);

        const nextQuestionButton = document.createElement('button');
        nextQuestionButton.textContent = 'Next Question';
        nextQuestionButton.id = 'gm-next-question-btn';
        nextQuestionButton.style.marginLeft = '10px';
        nextQuestionButton.addEventListener('click', nextQuestion);

        const endGameButton = document.createElement('button');
        endGameButton.textContent = 'End Game';
        endGameButton.id = 'gm-end-game-btn';
        endGameButton.style.marginLeft = '10px';
        endGameButton.addEventListener('click', endGame);

        // Append these buttons to the GM setup section (or a dedicated GM control area)
        const gameMasterSetupSection = document.getElementById('game-master-setup-section');
        gameMasterSetupSection.appendChild(startGameButton);
        gameMasterSetupSection.appendChild(nextQuestionButton);
        gameMasterSetupSection.appendChild(endGameButton);


    } catch (error) {
        console.error("Error creating game:", error);
        alert("Failed to create game: " + error.message);
    }
});

// Final Scoreboard Buttons
document.getElementById('play-again-btn').addEventListener('click', () => {
    // Logic to reset game or create new one
    alert('Play Again clicked (functionality to be implemented)');
    showSection('lobby-section');
});

document.getElementById('return-to-lobby-btn').addEventListener('click', () => {
    showSection('lobby-section');
});


// --- Initialization ---

// Firebase Auth State Listener: Controls which section is visible
onAuthStateChanged(user => {
    currentUser = user;
    renderAuthStatus(user);
    if (user) {
        // User is logged in, show lobby
        showSection('lobby-section');
    } else {
        // User is not logged in, show login section
        showSection('login-section');
    }
});

// Initial load: The onAuthStateChanged listener will handle the initial view.
// No direct call to showSection here.