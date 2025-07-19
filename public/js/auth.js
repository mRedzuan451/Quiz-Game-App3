// js/auth.js
import { auth, saveUserData } from './firebaseService.js';

/**
 * Handles user registration.
 * @param {string} email
 * @param {string} password
 * @param {string} username - Optional, for display name.
 * @returns {Promise<firebase.UserCredential>}
 */
export const registerUser = async (email, password, username) => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await saveUserData(userCredential.user.uid, { email: email, username: username || email });
        console.log("User registered:", userCredential.user.uid);
        return userCredential;
    } catch (error) {
        console.error("Registration error:", error.message);
        throw error;
    }
};

/**
 * Handles user login.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<firebase.UserCredential>}
 */
export const loginUser = async (email, password) => {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("User logged in:", userCredential.user.uid);
        return userCredential;
    } catch (error) {
        console.error("Login error:", error.message);
        throw error;
    }
};

/**
 * Handles user logout.
 * @returns {Promise<void>}
 */
export const logoutUser = () => {
    return auth.signOut().then(() => {
        console.log("User logged out.");
    }).catch((error) => {
        console.error("Logout error:", error.message);
        throw error;
    });
};

/**
 * Attaches an observer to user authentication state changes.
 * @param {function} callback - Function to call with the current user object (or null).
 */
export const onAuthStateChanged = (callback) => {
    auth.onAuthStateChanged(callback);
};