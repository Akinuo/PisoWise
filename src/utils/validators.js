// src/utils/validators.js

// ─── Card / Financial Validators ─────────────────────────────────────────────

/**
 * Validates that input is exactly 4 digits (last four of a card).
 * Never validate full card numbers — we only accept last 4 digits.
 */
export const isValidLastFour = (val) => {
  const str = String(val || '').trim();
  return /^\d{4}$/.test(str);
};

/**
 * Validates OTP format (6 digits)
 */
export const isValidOTP = (val) => {
  return /^\d{6}$/.test(String(val || '').trim());
};

/**
 * Validates a positive monetary amount
 */
export const isValidAmount = (val, max = 10_000_000) => {
  const num = parseFloat(String(val).replace(/[₱,\s]/g, ''));
  return !isNaN(num) && num > 0 && num <= max;
};

/**
 * Validates an email address
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validates Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX)
 */
export const isValidPHMobile = (num) => {
  const cleaned = String(num || '').replace(/[\s-()]/g, '');
  return /^(09\d{9}|\+639\d{9})$/.test(cleaned);
};

/**
 * Validates password strength (min 6 chars)
 */
export const isStrongPassword = (password) => {
  return String(password || '').length >= 6;
};

/**
 * Validates that a date string is not in the future
 */
export const isNotFutureDate = (dateStr) => {
  if (!dateStr) return true;
  return new Date(dateStr) <= new Date();
};

/**
 * Validates that a date is in the future (for deadlines)
 */
export const isFutureDate = (dateStr) => {
  if (!dateStr) return true;
  return new Date(dateStr) > new Date();
};

/**
 * Validates interest rate (0 to 100%)
 */
export const isValidInterestRate = (rate) => {
  const num = parseFloat(rate);
  return !isNaN(num) && num >= 0 && num <= 100;
};

// ─── Security Guards ─────────────────────────────────────────────────────────

/**
 * Detects if a string looks like a full card number pattern.
 * Used as a safety guard to prevent accidental submission.
 */
export const looksLikeCardNumber = (str) => {
  const cleaned = String(str || '').replace(/[\s-]/g, '');
  // 13-19 digit number
  return /^\d{13,19}$/.test(cleaned);
};

/**
 * Detects if a string looks like a CVV
 */
export const looksLikeCVV = (str) => {
  return /^\d{3,4}$/.test(String(str || '').trim());
};

/**
 * Detects if a string looks like a card expiry date
 */
export const looksLikeExpiry = (str) => {
  return /^(0[1-9]|1[0-2])\/?\d{2,4}$/.test(String(str || '').trim());
};

/**
 * Run all security checks before submitting card data.
 * Returns an error message if sensitive data is detected, null if safe.
 */
export const cardSecurityCheck = (data) => {
  const { lastFour, nickname, note } = data;

  if (looksLikeCardNumber(lastFour)) {
    return '⚠️ Ilagay lamang ang HULING 4 DIGIT. Huwag i-type ang buong card number.';
  }

  const allText = `${nickname || ''} ${note || ''}`;
  if (looksLikeCardNumber(allText.replace(/\s/g, ''))) {
    return '⚠️ Detected full card number in fields. Only last 4 digits allowed.';
  }

  return null; // All clear
};

// ─── Form Validation Rules (React Hook Form compatible) ──────────────────────

export const AMOUNT_RULES = {
  required: 'Maglagay ng halaga',
  min:      { value: 0.01,     message: 'Dapat mas malaki sa 0' },
  max:      { value: 10000000, message: 'Halaga ay masyadong malaki' },
  validate: (v) => isValidAmount(v) || 'Maglagay ng tamang halaga',
};

export const LAST_FOUR_RULES = {
  required: 'Ilagay ang huling 4 na digit',
  pattern:  { value: /^\d{4}$/, message: 'Eksaktong 4 na numero lamang' },
  validate: {
    notFullCard: (v) => !looksLikeCardNumber(v) || 'Huling 4 digits lamang — huwag ang buong card number',
    notCVV:      (v) => v.length === 4            || 'Eksaktong 4 na digit',
  },
};

export const EMAIL_RULES = {
  required: 'Email is required',
  pattern:  { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
};

export const PASSWORD_RULES = {
  required:  'Password is required',
  minLength: { value: 6, message: 'At least 6 characters required' },
};
