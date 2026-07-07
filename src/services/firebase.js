// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';

// ─── Firebase Config ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─── Initialize ───────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─── Auth Helpers ─────────────────────────────────────────────────────────
export const registerUser = async (email, password, displayName, profileData = {}) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  // Create Firestore user profile
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:         cred.user.uid,
    email,
    displayName,
    createdAt:   serverTimestamp(),
    onboarded:   false,
    monthlyIncome: Number(profileData.monthlyIncome) || 0,
    authProvider: 'password',
  });

  return cred.user;
};

export const loginUser    = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signInWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  const { user } = cred;
  const profileRef = doc(db, 'users', user.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    await setDoc(profileRef, {
      uid:           user.uid,
      email:         user.email,
      displayName:   user.displayName || user.email?.split('@')[0] || 'PisoWise User',
      photoURL:      user.photoURL || null,
      createdAt:     serverTimestamp(),
      onboarded:     false,
      monthlyIncome: 0,
      authProvider:  'google',
    });
  } else {
    await updateDoc(profileRef, {
      displayName:  profileSnap.data().displayName || user.displayName || user.email?.split('@')[0] || 'PisoWise User',
      photoURL:     user.photoURL || profileSnap.data().photoURL || null,
      authProvider: profileSnap.data().authProvider || 'google',
      lastLoginAt:  serverTimestamp(),
    });
  }

  return user;
};
export const logoutUser   = () => firebaseSignOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);

// ─── User Profile ─────────────────────────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
};

// ─── Transactions ─────────────────────────────────────────────────────────
export const addTransaction = async (userId, data) => {
  return addDoc(collection(db, 'transactions'), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getTransactions = async (userId, limitCount = 50) => {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTransactionsByType = async (userId, type, limitCount = 30) => {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    where('type', '==', type),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTransactionsByMonth = async (userId, year, month) => {
  const start = Timestamp.fromDate(new Date(year, month - 1, 1));
  const end   = Timestamp.fromDate(new Date(year, month, 0, 23, 59, 59));
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateTransaction = async (transactionId, data) => {
  await updateDoc(doc(db, 'transactions', transactionId), { ...data, updatedAt: serverTimestamp() });
};

export const deleteTransaction = async (transactionId) => {
  await deleteDoc(doc(db, 'transactions', transactionId));
};

// ─── Recurring Transactions (bills/income that repeat) ────────────────────
export const addRecurringTransaction = async (userId, data) => {
  return addDoc(collection(db, 'recurringTransactions'), {
    userId,
    ...data,
    active: true,
    createdAt: serverTimestamp(),
  });
};

// No orderBy here on purpose — this list is always small (a handful of
// bills per user), so we sort client-side instead of requiring a composite
// Firestore index just for this one query.
export const getRecurringTransactions = async (userId) => {
  const q = query(collection(db, 'recurringTransactions'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateRecurringTransaction = async (id, data) => {
  await updateDoc(doc(db, 'recurringTransactions', id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteRecurringTransaction = async (id) => {
  await deleteDoc(doc(db, 'recurringTransactions', id));
};

// ─── Savings Goals ────────────────────────────────────────────────────────
export const addSavingsGoal = async (userId, data) => {
  return addDoc(collection(db, 'savings'), {
    userId,
    ...data,
    currentAmount: 0,
    createdAt: serverTimestamp(),
  });
};

export const getSavingsGoals = async (userId) => {
  const q = query(
    collection(db, 'savings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateSavingsGoal = async (goalId, data) => {
  await updateDoc(doc(db, 'savings', goalId), { ...data, updatedAt: serverTimestamp() });
};

export const deleteSavingsGoal = async (goalId) => {
  await deleteDoc(doc(db, 'savings', goalId));
};

// ─── Debts ────────────────────────────────────────────────────────────────
export const addDebt = async (userId, data) => {
  return addDoc(collection(db, 'debts'), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getDebts = async (userId) => {
  const q = query(
    collection(db, 'debts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateDebt = async (debtId, data) => {
  await updateDoc(doc(db, 'debts', debtId), { ...data, updatedAt: serverTimestamp() });
};

export const deleteDebt = async (debtId) => {
  await deleteDoc(doc(db, 'debts', debtId));
};

// ─── Cards (last 4 digits only) ───────────────────────────────────────────
export const addCard = async (userId, data) => {
  // Safety check — never store sensitive data. Prefixed with _ to signal
  // these are intentionally destructured-and-discarded, not dead code.
  const { fullNumber: _fullNumber, cvv: _cvv, expiryDate: _expiryDate, ...safeData } = data;
  return addDoc(collection(db, 'cards'), {
    userId,
    ...safeData,
    verified: true, // OTP verified before reaching here
    createdAt: serverTimestamp(),
  });
};

export const getCards = async (userId) => {
  const q = query(collection(db, 'cards'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateCard = async (cardId, data) => {
  // Same exclusion as addCard — never let sensitive fields reach Firestore.
  const { fullNumber: _fullNumber, cvv: _cvv, expiryDate: _expiryDate, ...safeData } = data;
  await updateDoc(doc(db, 'cards', cardId), { ...safeData, updatedAt: serverTimestamp() });
};

export const deleteCard = async (cardId) => {
  await deleteDoc(doc(db, 'cards', cardId));
};

// ─── OTP Tokens ───────────────────────────────────────────────────────────
// ── OTP stored at otpTokens/{userId} — direct path, no query/index needed ──
const MAX_OTP_ATTEMPTS = 5;

// SHA-256 hash via the Web Crypto API — never store/compare OTPs in plaintext.
const hashOTP = async (otpStr) => {
  const bytes  = new TextEncoder().encode(otpStr);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const storeOTPToken = async (userId, otp) => {
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 min
  const otpStr  = String(otp).trim();
  const otpHash = await hashOTP(otpStr);

  // Persist only the hash — the plaintext code lives solely in the email sent to the user.
  await setDoc(doc(db, 'otpTokens', userId), {
    userId,
    otpHash,
    attempts:  0,
    expiresAt,
    createdAt: new Date().toISOString(), // plain string — no serverTimestamp() delay issue
  });

  // Fast same-device fallback — also hashed, never plaintext.
  try {
    sessionStorage.setItem(
      `pw_otp_${userId}`,
      JSON.stringify({ otpHash, attempts: 0, expiresAt: Date.now() + 10 * 60 * 1000 })
    );
  } catch (_) { /* sessionStorage unavailable — Firestore path still works */ }
};

export const verifyOTPToken = async (userId, enteredOTP) => {
  const entered     = String(enteredOTP).trim();
  const enteredHash = await hashOTP(entered);

  // ── Fast path: sessionStorage (same device, no network round-trip) ────────
  try {
    const raw = sessionStorage.getItem(`pw_otp_${userId}`);
    if (raw) {
      const { otpHash, attempts = 0, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) {
        sessionStorage.removeItem(`pw_otp_${userId}`);
      } else if (attempts >= MAX_OTP_ATTEMPTS) {
        // Too many wrong tries — force the user to request a new code.
        return false;
      } else if (otpHash === enteredHash) {
        sessionStorage.removeItem(`pw_otp_${userId}`);
        deleteDoc(doc(db, 'otpTokens', userId)).catch(() => {});
        return true;
      } else {
        sessionStorage.setItem(`pw_otp_${userId}`, JSON.stringify({ otpHash, attempts: attempts + 1, expiresAt }));
      }
    }
  } catch (_) { /* ignore sessionStorage errors */ }

  // ── Firestore path: direct getDoc — no query, no composite index ──────────
  try {
    const tokenRef  = doc(db, 'otpTokens', userId);
    const tokenSnap = await getDoc(tokenRef);
    if (!tokenSnap.exists()) return false;

    const data = tokenSnap.data();

    // Check expiry (stored as Firestore Timestamp)
    const expiresAt = data.expiresAt?.toDate
      ? data.expiresAt.toDate()
      : new Date(data.expiresAt);
    if (new Date() > expiresAt) {
      await deleteDoc(tokenRef);
      return false;
    }

    // Lock out after too many wrong attempts within the validity window.
    if ((data.attempts || 0) >= MAX_OTP_ATTEMPTS) return false;

    // Compare hashes, not plaintext.
    if (data.otpHash !== enteredHash) {
      await updateDoc(tokenRef, { attempts: (data.attempts || 0) + 1 });
      return false;
    }

    // Valid — delete (single-use)
    await deleteDoc(tokenRef);
    return true;
  } catch (e) {
    console.error('OTP Firestore verify error:', e);
    return false;
  }
};

// ─── AI Insights ──────────────────────────────────────────────────────────
export const saveInsight = async (userId, content, type = 'weekly') => {
  return addDoc(collection(db, 'insights'), {
    userId,
    content,
    type,
    generatedAt: serverTimestamp(),
  });
};

export const getInsights = async (userId, limitCount = 10) => {
  const q = query(
    collection(db, 'insights'),
    where('userId', '==', userId),
    orderBy('generatedAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Budgets ──────────────────────────────────────────────────────────────
export const saveBudget = async (userId, budgetData) => {
  const { month, year } = budgetData;
  // Check if budget for this month exists
  const q = query(
    collection(db, 'budgets'),
    where('userId', '==', userId),
    where('month', '==', month),
    where('year', '==', year)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { ...budgetData, updatedAt: serverTimestamp() });
    return snap.docs[0].id;
  }

  const ref = await addDoc(collection(db, 'budgets'), {
    userId,
    ...budgetData,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getBudget = async (userId, month, year) => {
  const q = query(
    collection(db, 'budgets'),
    where('userId', '==', userId),
    where('month', '==', month),
    where('year', '==', year),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// No orderBy — a user's budget history is at most one doc per month, so it's
// always a small list. Sorted client-side to avoid needing a composite index.
export const getBudgetHistory = async (userId) => {
  const q = query(collection(db, 'budgets'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Real-time Listeners ──────────────────────────────────────────────────
export const listenTransactions = (userId, callback) => {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

// ─── Exports ──────────────────────────────────────────────────────────────
export { app, auth, db, serverTimestamp, Timestamp };
