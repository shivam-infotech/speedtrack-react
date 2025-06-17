// Simple secure storage utility
// This uses a basic encoding technique to make data less visible in browser storage

// Simple encode/decode functions using base64 and a basic XOR operation
const SECRET_KEY = 'speedtrack-key';

// Simple XOR function to obfuscate data
function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

// Encode data for storage
export function encodeData(data) {
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = xorEncrypt(jsonString, SECRET_KEY);
        return btoa(encrypted); // Convert to base64
    } catch (error) {
        console.error('Encoding error:', error);
        return null;
    }
}

// Decode data from storage
export function decodeData(encodedData) {
    try {
        if (!encodedData) return null;
        const encrypted = atob(encodedData); // Convert from base64
        const decrypted = xorEncrypt(encrypted, SECRET_KEY);
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Decoding error:', error);
        return null;
    }
}

// Create a middleware for Zustand
export const createSimpleSecureStore = (name) => (config) => (set, get, api) => {
    // Try to load initial state
    let savedState = null;
    try {
        const storedData = sessionStorage.getItem(name);
        if (storedData) {
            savedState = decodeData(storedData);
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
    }

    // Create store with initial state
    const state = config(
        (updates, replace) => {
            // Apply updates to the store
            set(updates, replace);
            // Save the updated state
            try {
                const currentState = get();
                const encoded = encodeData(currentState);
                sessionStorage.setItem(name, encoded);
            } catch (error) {
                console.error('Error saving to storage:', error);
            }
        },
        get,
        api
    );

    // Return the store with initial state if available
    return {
        ...state,
        ...(savedState || {})
    };
};
