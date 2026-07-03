// src/services/emailjs.js
import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Initialize EmailJS once
emailjs.init(PUBLIC_KEY);

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export const generateOTP = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000)).padStart(6, '0');
};

/**
 * Send OTP email via EmailJS
 * EmailJS template should use: {{to_email}}, {{otp_code}}, {{user_name}}, {{purpose}}
 */
export const sendOTPEmail = async ({ toEmail, userName, otp, purpose = 'add a card' }) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('EmailJS is not configured. Check your .env file.');
  }

  const templateParams = {
    to_email:  toEmail,
    user_name: userName || 'PisoWise User',
    otp_code:  otp,
    purpose,
    app_name:  'PisoWise',
    // Validity message
    valid_for: '10 minutes',
  };

  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    if (result.status !== 200) {
      throw new Error(`EmailJS returned status: ${result.status}`);
    }
    return true;
  } catch (error) {
    console.error('EmailJS send error:', error);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

/**
 * Full OTP flow: generate → send → return OTP for storage
 */
export const initiateOTPVerification = async ({ userEmail, userName, purpose }) => {
  const otp = generateOTP();
  await sendOTPEmail({ toEmail: userEmail, userName, otp, purpose });
  return otp; // Store this OTP (in Firestore) to verify later
};

/**
 * Validate OTP format
 */
export const isValidOTPFormat = (input) => {
  return /^\d{6}$/.test(String(input).trim());
};
