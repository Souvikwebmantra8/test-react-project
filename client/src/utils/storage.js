/**
 * Storage Utility for QwicbookPro App
 * 
 * This utility handles storing and retrieving user session data.
 * 
 * Storage Options:
 * - localStorage: Persists even after app/browser closes (current implementation)
 * - sessionStorage: Clears when app/browser closes (session-based)
 * 
 * Currently using localStorage for persistent login.
 * Change STORAGE_TYPE to 'sessionStorage' if you want session-based storage.
 */

// Choose storage type: 'localStorage' (persistent) or 'sessionStorage' (session-based)
const STORAGE_TYPE = 'localStorage';

// Get the storage object
const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return STORAGE_TYPE === 'sessionStorage' ? window.sessionStorage : window.localStorage;
};

// Storage keys
export const STORAGE_KEYS = {
  IS_LOGGED_IN: 'qwicbookpro_is_logged_in',
  USER_EMAIL: 'qwicbookpro_user_email',
  LOGIN_TIMESTAMP: 'qwicbookpro_login_timestamp',
  USER_DATA: 'qwicbookpro_user_data' // For storing additional user data if needed
};

/**
 * Save login information
 * @param {string} email - User's email address
 * @param {object} additionalData - Optional additional user data to store
 */
export const saveLogin = (email, additionalData = {}) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    storage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    storage.setItem(STORAGE_KEYS.LOGIN_TIMESTAMP, new Date().toISOString());
    
    // Store additional user data if provided
    if (Object.keys(additionalData).length > 0) {
      storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(additionalData));
    }

    console.log('[Storage] Login data saved:', { email, storageType: STORAGE_TYPE });
    return true;
  } catch (error) {
    console.error('[Storage] Error saving login data:', error);
    return false;
  }
};

/**
 * Get stored login information
 * @returns {object|null} Login data or null if not logged in
 */
export const getLogin = () => {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const isLoggedIn = storage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
    const email = storage.getItem(STORAGE_KEYS.USER_EMAIL);
    const timestamp = storage.getItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
    const userDataStr = storage.getItem(STORAGE_KEYS.USER_DATA);

    if (isLoggedIn === 'true' && email) {
      const loginData = {
        isLoggedIn: true,
        email: email,
        loginTimestamp: timestamp,
        userData: userDataStr ? JSON.parse(userDataStr) : null
      };

      console.log('[Storage] Login data retrieved:', { email, storageType: STORAGE_TYPE });
      return loginData;
    }

    return null;
  } catch (error) {
    console.error('[Storage] Error retrieving login data:', error);
    return null;
  }
};

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
export const isLoggedIn = () => {
  const loginData = getLogin();
  return loginData !== null && loginData.isLoggedIn === true;
};

/**
 * Get stored user email
 * @returns {string|null} User email or null
 */
export const getUserEmail = () => {
  const loginData = getLogin();
  return loginData ? loginData.email : null;
};

/**
 * Clear all login data (logout)
 */
export const clearLogin = () => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    storage.removeItem(STORAGE_KEYS.USER_EMAIL);
    storage.removeItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
    storage.removeItem(STORAGE_KEYS.USER_DATA);

    console.log('[Storage] Login data cleared');
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing login data:', error);
    return false;
  }
};

/**
 * Get storage type being used
 * @returns {string} 'localStorage' or 'sessionStorage'
 */
export const getStorageType = () => {
  return STORAGE_TYPE;
};

/**
 * Get storage information for debugging
 * @returns {object} Storage information
 */
export const getStorageInfo = () => {
  const storage = getStorage();
  if (!storage) return { available: false };

  const loginData = getLogin();
  
  return {
    available: true,
    type: STORAGE_TYPE,
    isLoggedIn: loginData !== null,
    email: loginData ? loginData.email : null,
    loginTimestamp: loginData ? loginData.loginTimestamp : null,
    storageSize: JSON.stringify(storage).length // Approximate size
  };
};

