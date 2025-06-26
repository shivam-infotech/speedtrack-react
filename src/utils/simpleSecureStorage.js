const SECRET_KEY = 'speedtrack-key';

const storage = {
    memoryStorage: {},
    isLocalStorageAvailable: function () {
        try {
            const testKey = '__storage_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    setItem: function (key, value) {
        try {
            if (this.isLocalStorageAvailable()) {
                window.localStorage.setItem(key, value);
            } else {
                this.memoryStorage[key] = value;
                // Try to notify React Native if possible
                if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'STORAGE_UPDATED',
                        key: key,
                        value: value
                    }));
                }
            }
        } catch (e) {
            console.error('Storage error:', e);
            this.memoryStorage[key] = value;
        }
    },

    getItem: function (key) {
        try {
            if (this.isLocalStorageAvailable()) {
                return window.localStorage.getItem(key);
            } else {
                return this.memoryStorage[key] || null;
            }
        } catch (e) {
            console.error('Storage error:', e);
            return this.memoryStorage[key] || null;
        }
    },

    removeItem: function (key) {
        try {
            if (this.isLocalStorageAvailable()) {
                window.localStorage.removeItem(key);
            }
            delete this.memoryStorage[key];
        } catch (e) {
            console.error('Storage error:', e);
            delete this.memoryStorage[key];
        }
    }
};

function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

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

export const createSimpleSecureStore = (name) => (config) => (set, get, api) => {
    let savedState = null;
    try {
        const storedData = storage.getItem(name);
        if (storedData) {
            savedState = decodeData(storedData);
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
    }

    const state = config(
        (updates, replace) => {
            set(updates, replace);
            try {
                const currentState = get();
                const encoded = encodeData(currentState);
                storage.setItem(name, encoded);

                console.log(`Store updated: ${name}`, {
                    currentState,
                    usingSessionStorage: storage.isLocalStorageAvailable()
                });
            } catch (error) {
                console.error('Error saving to storage:', error);
            }
        },
        get,
        api
    );

    return {
        ...state,
        ...(savedState || {})
    };
};

export function initWebViewStorage() {
    const isInWebView = window.ReactNativeWebView !== undefined;

    if (isInWebView) {
        console.log('Running in React Native WebView - using memory storage fallback');

        window.setInitialStorageState = function (storageData) {
            try {
                const parsedData = JSON.parse(storageData);
                Object.keys(parsedData).forEach(key => {
                    storage.memoryStorage[key] = parsedData[key];
                });
                console.log('Initial storage state set from React Native');
            } catch (e) {
                console.error('Failed to set initial storage state:', e);
            }
        };

        if (typeof window.ReactNativeWebView.postMessage === 'function') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'STORAGE_READY'
            }));
        }
    }
}
