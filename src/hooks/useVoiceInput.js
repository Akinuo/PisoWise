// src/hooks/useVoiceInput.js
import { useState, useEffect, useRef, useCallback } from 'react';

const VOICE_EXAMPLES = [
  'Gastos ko ay dalawang daan para sa pagkain',
  'Kumita ako ng sampung libo ngayon',
  'Binayad ko ng limang daan sa tubig',
];

/**
 * Parses voice transcript into structured transaction data.
 * Understands Taglish commands.
 */
const parseVoiceCommand = (transcript) => {
  const text = transcript.toLowerCase().trim();
  let amount      = 0;
  let category    = 'other';
  let type        = 'expense';
  let description = transcript;

  // ── Detect type ───────────────────────────────────────────────
  const incomeKeywords  = ['kumita', 'kita', 'natanggap', 'sweldo', 'padala', 'income', 'earned', 'received', 'suweldo'];
  const expenseKeywords = ['gastos', 'binayad', 'nabili', 'nagbayad', 'spent', 'paid', 'bought', 'bayad', 'gumastos'];

  if (incomeKeywords.some(k  => text.includes(k))) type = 'income';
  if (expenseKeywords.some(k => text.includes(k))) type = 'expense';

  // ── Parse amount ──────────────────────────────────────────────
  // Match digits (e.g. "200", "1500.50", "₱500")
  const digitMatch = text.match(/₱?\s*(\d[\d,]*(?:\.\d{1,2})?)/);
  if (digitMatch) {
    amount = parseFloat(digitMatch[1].replace(',', ''));
  } else {
    // Match Filipino number words
    const numberMap = {
      'isang daan': 100,   'dalawang daan': 200,  'tatlong daan': 300,
      'apat na raan': 400,  'limang daan': 500,    'anim na raan': 600,
      'pitong daan': 700,   'walong daan': 800,    'siyam na raan': 900,
      'isang libo': 1000,   'dalawang libo': 2000, 'tatlong libo': 3000,
      'apat na libo': 4000, 'limang libo': 5000,   'sampung libo': 10000,
      'labinlimang libo': 15000, 'dalawampung libo': 20000,
      'singkwenta': 50, 'baynte': 20, 'tatlumpu': 30,
      'singkwenta piso': 50, 'isang piso': 1,
    };
    for (const [word, val] of Object.entries(numberMap)) {
      if (text.includes(word)) { amount = val; break; }
    }
  }

  // ── Category detection ────────────────────────────────────────
  const categoryMap = {
    food:        ['pagkain', 'kain', 'ulam', 'lunch', 'dinner', 'breakfast', 'merienda', 'restaurant', 'food', 'lutuin'],
    transport:   ['pamasahe', 'jeep', 'bus', 'tricycle', 'grab', 'angkas', 'gas', 'gasolina', 'transport'],
    utilities:   ['kuryente', 'tubig', 'meralco', 'maynilad', 'internet', 'wifi', 'bill'],
    rent:        ['upa', 'abang', 'bahay', 'renta', 'rent'],
    health:      ['gamot', 'doktor', 'ospital', 'medical', 'botika', 'medicine', 'health'],
    education:   ['tuition', 'eskwela', 'libro', 'school', 'fees', 'allowance ng bata'],
    load:        ['load', 'smart', 'globe', 'dito', 'data', 'minutes'],
    grocery:     ['grocery', 'palengke', 'supermarket', 'bilihin', 'groceries'],
    salary:      ['sweldo', 'suweldo', 'salary', 'payroll'],
    business:    ['negosyo', 'tinda', 'kita sa negosyo', 'business'],
    remittance:  ['padala', 'remittance', 'send money', 'western union', 'gcash padala'],
  };

  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => text.includes(k))) {
      category = cat;
      break;
    }
  }

  return { type, amount, category, description: description.trim() };
};

// ─────────────────────────────────────────────────────────────────────────────
const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [parsedData,  setParsedData]  = useState(null);
  const [error,       setError]       = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  // ── Check Web Speech API support ──────────────────────────────
  useEffect(() => {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsSupported(supported);
  }, []);

  // ── Stop the mic if the component unmounts mid-listen ──────────
  // Without this, navigating away while recognition is active leaves
  // the microphone open in the background.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // ── Start listening ───────────────────────────────────────────
  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setParsedData(null);

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Voice input is not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang            = 'en-PH';
    recognition.continuous      = false;
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => setIsListening(false);
    recognition.onerror = (e) => {
      setIsListening(false);
      const msg =
        e.error === 'no-speech'  ? 'No speech detected. Try again.'
        : e.error === 'not-allowed' ? 'Microphone permission denied.'
        : e.error === 'network'     ? 'Network error. Check your connection.'
        : 'Voice recognition failed.';
      setError(msg);
    };

    recognition.onresult = (e) => {
      const result = e.results[e.results.length - 1];
      const text   = result[0].transcript;
      setTranscript(text);
      if (result.isFinal) {
        setParsedData(parseVoiceCommand(text));
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setError('Could not start voice input. Please try again.');
    }
  }, []);

  // ── Stop listening ────────────────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setParsedData(null);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    parsedData,
    error,
    isSupported,
    startListening,
    stopListening,
    reset,
    examples: VOICE_EXAMPLES,
  };
};

export default useVoiceInput;