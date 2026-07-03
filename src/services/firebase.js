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
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

// FCM only works in browsers that support it (not in Android Capacitor WebView for this config)
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('FCM not available in this environment:', e.message);
}

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
    fcmToken:    null,
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
      fcmToken:      null,
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
  // Safety check — never store sensitive data
  const { fullNumber, cvv, expiryDate, ...safeData } = data;
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
  const { fullNumber, cvv, expiryDate, ...safeData } = data;
  await updateDoc(doc(db, 'cards', cardId), { ...safeData, updatedAt: serverTimestamp() });
};

export const deleteCard = async (cardId) => {
  await deleteDoc(doc(db, 'cards', cardId));
};

// ─── OTP Tokens ───────────────────────────────────────────────────────────
// ── OTP stored at otpTokens/{userId} — direct path, no query/index needed ──
export const storeOTPToken = async (userId, otp) => {
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 min
  const otpStr = String(otp).trim();

  // 1. Persist to Firestore (use setDoc so path is predictable — no composite index needed)
  await setDoc(doc(db, 'otpTokens', userId), {
    userId,
    otp:       otpStr,
    expiresAt,
    createdAt: new Date().toISOString(), // plain string — no serverTimestamp() delay issue
  });

  // 2. Also keep in sessionStorage as a fast same-device fallback
  try {
    sessionStorage.setItem(
      `pw_otp_${userId}`,
      JSON.stringify({ otp: otpStr, expiresAt: Date.now() + 10 * 60 * 1000 })
    );
  } catch (_) { /* sessionStorage unavailable — Firestore path still works */ }
};

export const verifyOTPToken = async (userId, enteredOTP) => {
  const entered = String(enteredOTP).trim();

  // ── Fast path: sessionStorage (same device, no network round-trip) ────────
  try {
    const raw = sessionStorage.getItem(`pw_otp_${userId}`);
    if (raw) {
      const { otp, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) {
        sessionStorage.removeItem(`pw_otp_${userId}`);
      } else if (otp === entered) {
        sessionStorage.removeItem(`pw_otp_${userId}`);
        // Clean up Firestore token in background
        deleteDoc(doc(db, 'otpTokens', userId)).catch(() => {});
        return true;
      } else {
        // Wrong code — let Firestore double-check, don't short-circuit
      }
    }
  } catch (_) { /* ignore sessionStorage errors */ }

  // ── Firestore path: direct getDoc — no query, no composite index ──────────
  try {
    const tokenSnap = await getDoc(doc(db, 'otpTokens', userId));
    if (!tokenSnap.exists()) return false;

    const data = tokenSnap.data();

    // Check expiry (stored as Firestore Timestamp)
    const expiresAt = data.expiresAt?.toDate
      ? data.expiresAt.toDate()
      : new Date(data.expiresAt);
    if (new Date() > expiresAt) {
      await deleteDoc(doc(db, 'otpTokens', userId));
      return false;
    }

    // Compare OTP
    if (data.otp !== entered) return false;

    // Valid — delete (single-use)
    await deleteDoc(doc(db, 'otpTokens', userId));
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

// ─── FCM Push Notifications ───────────────────────────────────────────────
export const requestFCMPermission = async (userId) => {
  if (!messaging) return null;
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
    });
    if (token && userId) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token });
    }
    return token;
  } catch (e) {
    console.warn('FCM token error:', e.message);
    return null;
  }
};

export const onFCMMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
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
export { app, auth, db, messaging, serverTimestamp, Timestamp };
