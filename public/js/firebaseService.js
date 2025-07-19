// js/firebaseService.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7aA0VtgmLCMWERSzxZgCwuxGIHWwbuv0",
  authDomain: "quiz-game-app-47c94.firebaseapp.com",
  projectId: "quiz-game-app-47c94",
  storageBucket: "quiz-game-app-47c94.firebasestorage.app",
  messagingSenderId: "326604015195",
  appId: "1:326604015195:web:4ef728c83b8b6c9ce0a17e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

/**
 * Saves user data to Firebase Realtime Database.
 * @param {string} userId - The Firebase user ID.
 * @param {object} userData - Data to save (e.g., email, username).
 */
export const saveUserData = (userId, userData) => {
    return database.ref('users/' + userId).set(userData);
};

/**
 * Retrieves user data from Firebase.
 * @param {string} userId - The Firebase user ID.
 * @returns {Promise<object>} - A promise resolving with user data.
 */
export const getUserData = (userId) => {
    return database.ref('users/' + userId).once('value').then(snapshot => snapshot.val());
};

/**
 * Creates a new quiz game session.
 * @param {object} gameSettings - Settings for the new game.
 * @returns {Promise<string>} - A promise resolving with the new game ID.
 */
export const createGameSession = (gameSettings) => {
    const newGameRef = database.ref('games').push();
    newGameRef.set({
        ...gameSettings,
        status: 'waiting', // waiting, active, finished
        players: {},
        currentQuestionIndex: -1,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP
    });
    return Promise.resolve(newGameRef.key);
};

/**
 * Joins a player to an existing game session.
 * @param {string} gameId - The ID of the game to join.
 * @param {string} playerId - The ID of the joining player.
 * @param {string} playerName - The name of the joining player.
 * @returns {Promise<void>}
 */
export const joinGameSession = (gameId, playerId, playerName) => {
    return database.ref(`games/${gameId}/players/${playerId}`).set({
        name: playerName,
        score: 0,
        answered: false
    });
};

/**
 * Fetches questions for a given mode.
 * In a real app, you'd likely have a separate admin tool to upload and categorize questions.
 * For this example, we'll assume a simple structure or fetch from a static source.
 * @param {string} mode - 'adult' or 'kids'.
 * @param {number} count - Number of questions to fetch.
 * @returns {Promise<Array>} - A promise resolving with an array of questions.
 */
export const fetchQuestions = async (mode, count) => {
    // This is a placeholder. In a real scenario, questions would be fetched from a 'questions' node
    // in your database, potentially with filters for mode and random selection.
    // For now, let's mock some data.
    const mockQuestions = {
        adult: [
            { id: 'q1', text: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], correct: "Paris" },
            { id: 'q2', text: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"], correct: "Da Vinci" },
            { id: 'q3', text: "What is 7 times 8?", options: ["54", "56", "64", "48"], correct: "56" },
            { id: 'q4', text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: "Pacific" },
            { id: 'q5', text: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], correct: "Mars" },
            { id: 'q6', text: "What is the chemical symbol for water?", options: ["H2O", "CO2", "O2", "N2"], correct: "H2O" },
            { id: 'q7', text: "How many continents are there?", options: ["5", "6", "7", "8"], correct: "7" },
            { id: 'q8', text: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Gazelle", "Tiger"], correct: "Cheetah" },
            { id: 'q9', text: "Which country is famous for the Great Wall?", options: ["India", "Japan", "China", "Korea"], correct: "China" },
            { id: 'q10', text: "What is the smallest prime number?", options: ["0", "1", "2", "3"], correct: "2" },
        ],
        kids: [
            { id: 'kq1', text: "What sound does a cat make?", options: ["Woof", "Meow", "Moo", "Roar"], correct: "Meow" },
            { id: 'kq2', text: "What color is the sky?", options: ["Green", "Red", "Blue", "Yellow"], correct: "Blue" },
            { id: 'kq3', text: "How many legs does a dog have?", options: ["2", "3", "4", "5"], correct: "4" },
            { id: 'kq4', text: "Which animal lays eggs?", options: ["Cow", "Chicken", "Dog", "Cat"], correct: "Chicken" },
            { id: 'kq5', text: "What do bees make?", options: ["Milk", "Honey", "Bread", "Cheese"], correct: "Honey" },
            { id: 'kq6', text: "What shape is a ball?", options: ["Square", "Circle", "Triangle", "Rectangle"], correct: "Circle" },
            { id: 'kq7', text: "What do you wear on your feet?", options: ["Hat", "Gloves", "Socks", "Shirt"], correct: "Socks" },
            { id: 'kq8', text: "What is the opposite of hot?", options: ["Big", "Cold", "Fast", "Happy"], correct: "Cold" },
            { id: 'kq9', text: "Which fruit is red and round?", options: ["Banana", "Apple", "Grape", "Orange"], correct: "Apple" },
            { id: 'kq10', text: "What part of a plant is usually green?", options: ["Flower", "Root", "Leaf", "Stem"], correct: "Leaf" },
        ]
    };

    // Simulate fetching random questions
    const selectedQuestions = [];
    const availableQuestions = mockQuestions[mode] || [];
    if (availableQuestions.length === 0) {
        console.warn(`No questions available for mode: ${mode}`);
        return [];
    }

    // Shuffle and pick 'count' questions
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        selectedQuestions.push(shuffled[i]);
    }
    return selectedQuestions;
};

/**
 * Gets a reference to a specific game session.
 * @param {string} gameId - The ID of the game.
 * @returns {firebase.database.Reference}
 */
export const getGameRef = (gameId) => {
    return database.ref(`games/${gameId}`);
};

/**
 * Updates a player's score in a game.
 * @param {string} gameId
 * @param {string} playerId
 * @param {number} scoreToAdd
 */
export const updatePlayerScore = (gameId, playerId, scoreToAdd) => {
    const playerRef = database.ref(`games/${gameId}/players/${playerId}/score`);
    playerRef.transaction((currentScore) => {
        return (currentScore || 0) + scoreToAdd;
    });
};

/**
 * Sets a player's 'answered' status.
 * @param {string} gameId
 * @param {string} playerId
 * @param {boolean} status
 */
export const setPlayerAnsweredStatus = (gameId, playerId, status) => {
    return database.ref(`games/${gameId}/players/${playerId}/answered`).set(status);
};

// Export auth and database instances for direct use in other modules if needed
export { auth, database };