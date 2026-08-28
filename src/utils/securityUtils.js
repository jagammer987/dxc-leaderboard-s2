/**
 * Stealth Admin Security & Rate-Limited PIN Management for DriftxCommune
 */

const DEFAULT_ADMIN_PIN = 'driftx2026';
const PIN_STORAGE_KEY = 'driftx_admin_custom_pin';
const SESSION_KEY = 'driftx_admin_auth_token';
const ATTEMPTS_KEY = 'driftx_failed_pin_attempts';
const LOCKOUT_KEY = 'driftx_pin_lockout_until';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Gets the current active Admin PIN (custom or default)
 */
export function getAdminPin() {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_ADMIN_PIN;
}

/**
 * Updates the Admin PIN
 */
export function setAdminPin(newPin) {
  if (!newPin || newPin.trim().length < 4) {
    throw new Error('PIN must be at least 4 characters');
  }
  localStorage.setItem(PIN_STORAGE_KEY, newPin.trim());
}

/**
 * Checks if brute force lockout is currently active
 */
export function getLockoutRemainingSeconds() {
  if (typeof window === 'undefined') return 0;
  const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
  const now = Date.now();
  if (lockoutUntil > now) {
    return Math.ceil((lockoutUntil - now) / 1000);
  }
  return 0;
}

/**
 * Verifies entered PIN against saved PIN with brute-force rate limiting
 */
export function verifyAdminPin(enteredPin) {
  if (!enteredPin) return false;

  const remaining = getLockoutRemainingSeconds();
  if (remaining > 0) {
    throw new Error(`Too many failed attempts. Security lockout active for ${Math.ceil(remaining / 60)} more minutes.`);
  }

  const currentPin = getAdminPin();
  const isValid = enteredPin.trim() === currentPin;

  if (isValid) {
    // Reset failed attempts on success
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
    return true;
  } else {
    // Increment failed attempts
    const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
    localStorage.setItem(ATTEMPTS_KEY, attempts.toString());

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_KEY, lockoutTime.toString());
      throw new Error(`Too many failed attempts! Security lockout active for 15 minutes.`);
    }

    const remainingAttempts = MAX_FAILED_ATTEMPTS - attempts;
    throw new Error(`Incorrect PIN. ${remainingAttempts} attempts remaining before security lockout.`);
  }
}

/**
 * Checks if current browser session is authenticated as Admin
 */
export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false;
  const token = sessionStorage.getItem(SESSION_KEY);
  return token === 'driftx_authenticated_marshal';
}

/**
 * Logs in the Admin session
 */
export function loginAdminSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, 'driftx_authenticated_marshal');
  }
}

/**
 * Logs out the Admin session
 */
export function logoutAdminSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
    const url = new URL(window.location);
    url.searchParams.delete('admin');
    url.searchParams.delete('marshal');
    window.history.replaceState({}, '', url);
  }
}
