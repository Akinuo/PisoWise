# PisoWise — Setup & Deployment Guide

Complete step-by-step instructions to get PisoWise running on web and Android.

---

## Prerequisites

- **Node.js** 20+ and npm 9+ → https://nodejs.org
- **Git** → https://git-scm.com
- **Firebase CLI** → `npm install -g firebase-tools`
- **Java JDK 17+** (for Android) → https://adoptium.net
- **Android Studio** (for Android) → https://developer.android.com/studio

---

## Step 1 — Clone & Install

```bash
# Unzip the project
unzip PisoWise.zip
cd PisoWise

# Install dependencies
npm install
```

---

## Step 2 — Firebase Setup (Spark Plan — Free)

### 2a. Create Firebase Project
1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `pisowise` → continue
3. Disable Google Analytics (optional) → **Create project**

### 2b. Enable Authentication
1. Left menu → **Authentication** → **Get started**
2. **Sign-in method** tab → Enable **Email/Password** → Save

### 2c. Enable Firestore
1. Left menu → **Firestore Database** → **Create database**
2. Choose **Start in production mode**
3. Select location: **asia-southeast1 (Singapore)** (closest to Philippines)
4. Click **Enable**

### 2d. Get Firebase Config
1. Project Settings (gear icon) → **General** tab
2. Scroll to **"Your apps"** → Click `</>` (Web)
3. Register app name `pisowise-web` → **Register app**
4. Copy the `firebaseConfig` object values

### 2e. Enable Hosting
1. Left menu → **Hosting** → **Get started**
2. Follow the prompts (Firebase CLI will handle the rest)

> **Note on push notifications:** this app deliberately does not use Firebase
> Cloud Messaging. Enabling Cloud Messaging's server-side send capability
> can prompt you to link a billing account (Blaze plan) even though FCM
> itself is free — and without Cloud Functions (also Blaze-only) there'd be
> nothing server-side to trigger a send anyway. Bill/budget reminders are
> instead computed client-side and shown as in-app banners (see
> RecurringBills.jsx and the category budget alerts in Transactions.jsx).

---

## Step 3 — Groq API Key

1. Sign up at **https://console.groq.com**
2. Go to **API Keys** → **Create API Key**
3. Name it `pisowise` → Copy the key (starts with `gsk_`)

> **Free tier:** 30 requests/minute, 14,400 requests/day — sufficient for personal use.
> Model: `llama-3.3-70b-versatile`

> **Security note:** used directly (`VITE_GROQ_API_KEY`), this key ships inside the
> client JS bundle — anyone can pull it out of devtools and rack up usage on your
> account. Once you're past local development, deploy this app to Vercel (free
> tier) and use `api/groq.js` as a server-side proxy instead: set `GROQ_API_KEY`
> (no `VITE_` prefix) as a Vercel environment variable, then point
> `VITE_GROQ_PROXY_URL` at your deployment's `/api/groq` endpoint. Firebase's
> Spark plan has no Cloud Functions to do this on the Firebase side, so Vercel's
> free functions are the easiest way to keep the key server-side without
> upgrading to Blaze.

---

## Step 4 — EmailJS Setup (OTP Emails)

### 4a. Create EmailJS Account
1. Go to **https://www.emailjs.com** → Sign up (free: 200 emails/month)
2. **Add Email Service** → choose Gmail, Outlook, or other SMTP
3. Follow connection steps → note your **Service ID** (format: `service_xxxxxxxx`)

### 4b. Create Email Template
1. **Email Templates** → **Create New Template**
2. Use this template content:

**Subject:** `{{app_name}} — Your Verification Code`

**Body:**
```
Hi {{user_name}},

Your PisoWise verification code is:

━━━━━━━━━━━━━━━
   {{otp_code}}
━━━━━━━━━━━━━━━

This code is valid for {{valid_for}}.
You requested this to: {{purpose}}

If you didn't request this, please ignore this email.

— The PisoWise Team 🇵🇭
```

3. Save template → note your **Template ID** (format: `template_xxxxxxxx`)
4. **Account** → **General** → copy **Public Key**

---

## Step 5 — Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
nano .env   # or use your code editor
```

Fill in all values:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=pisowise.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pisowise
VITE_FIREBASE_STORAGE_BUCKET=pisowise.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_GROQ_API_KEY=gsk_...

VITE_EMAILJS_SERVICE_ID=service_xxxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 6 — Deploy Firestore Rules & Indexes

```bash
# Login to Firebase CLI
firebase login

# Select your project
firebase use --add
# → Select your project ID → alias: default

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

---

## Step 7 — Run Locally (Development)

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Voice input** requires Chrome, Edge, or Samsung Internet.
> Firefox does not support the Web Speech API.

---

## Step 8 — Build & Deploy to Firebase Hosting

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at: `https://pisowise.web.app` (or your custom domain)

---

## Step 9 — Android App (Capacitor)

### 9a. Initialize Capacitor & Add Android

```bash
# Initialize Capacitor (already configured in capacitor.config.ts)
npx cap init PisoWise com.pisowise.app --web-dir dist

# Add Android platform
npx cap add android

# Build web app
npm run build

# Sync to Android
npx cap sync android
```

### 9b. Open in Android Studio

```bash
npx cap open android
```

Android Studio will open. Wait for Gradle sync to complete.

### 9c. Configure Android Permissions

Open `android/app/src/main/AndroidManifest.xml` and verify these permissions exist:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

### 9d. Add google-services.json

1. Firebase Console → Project Settings → **Your apps**
2. Click **Add app** → Android
3. Package name: `com.pisowise.app`
4. Download `google-services.json`
5. Place it at: `android/app/google-services.json`

### 9e. Run on Device/Emulator

```bash
# From Android Studio: Run → Run 'app'
# OR via CLI:
npx cap run android
```

### 9f. Build Release APK

1. Android Studio → **Build** → **Generate Signed Bundle / APK**
2. Choose **APK** → Next
3. Create or use existing keystore
4. Select **release** build variant
5. APK will be in `android/app/release/app-release.apk`

---

## Step 10 — Cloud Functions

PisoWise runs entirely on the **Spark (free) plan** and doesn't use Firebase Cloud Functions —
they require the pay-as-you-go Blaze plan. Everything (AI coaching, tracking, lessons, cards,
OTP verification) runs client-side or through free-tier Firebase services (Auth, Firestore).

If you later upgrade to Blaze and want server-side push notifications (budget alerts, weekly
summaries, debt reminders) or scheduled cleanup jobs, you'd add a `functions/` directory back
with `firebase-functions` and `firebase-admin`, then deploy with `firebase deploy --only functions`.
That's a separate addition, not something this project currently depends on.

---

## Step 11 — Custom Domain (Optional)

```bash
# Firebase Hosting console → Add custom domain
# Follow DNS verification steps
# SSL certificate is auto-provisioned
```

---

## Environment Reference

| Variable                     | Where to Get              | Required |
|------------------------------|---------------------------|----------|
| `VITE_FIREBASE_API_KEY`      | Firebase Console → Settings | ✅      |
| `VITE_FIREBASE_AUTH_DOMAIN`  | Firebase Console → Settings | ✅      |
| `VITE_FIREBASE_PROJECT_ID`   | Firebase Console → Settings | ✅      |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Settings | ✅    |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Settings | ✅ |
| `VITE_FIREBASE_APP_ID`       | Firebase Console → Settings | ✅      |
| `VITE_GROQ_API_KEY`          | console.groq.com           | ✅       |
| `VITE_EMAILJS_SERVICE_ID`    | emailjs.com → Services     | ✅       |
| `VITE_EMAILJS_TEMPLATE_ID`   | emailjs.com → Templates    | ✅       |
| `VITE_EMAILJS_PUBLIC_KEY`    | emailjs.com → Account      | ✅       |

---

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
→ Check your `.env` file has the correct `VITE_FIREBASE_API_KEY`
→ Make sure the `.env` file is in the project root (same folder as `package.json`)
→ Restart the dev server after editing `.env`

### Voice input not working
→ Must use **Chrome**, **Edge**, or **Samsung Internet**
→ Allow microphone permission when prompted
→ On Android, Capacitor's SpeechRecognition plugin handles this instead

### EmailJS OTP not sending
→ Verify your Email Service is connected in EmailJS dashboard
→ Check Template ID and Service ID are correct
→ Confirm the `to_email` variable is in your template
→ Free plan allows 200 emails/month — check usage

### Firestore permission denied
→ Run `firebase deploy --only firestore:rules` to deploy security rules
→ Verify you're logged in with the correct Firebase account

### Android build fails
→ Ensure Java JDK 17+ is installed: `java -version`
→ Run `npx cap sync android` after any code changes
→ In Android Studio: File → Invalidate Caches / Restart

### "Groq API rate limit exceeded"
→ Free tier: 30 req/min — space out AI feature usage
→ Consider caching AI responses in Firestore

---

## Firebase Spark Plan Limits (Free Tier)

| Service      | Free Limit              | PisoWise Usage         |
|-------------|-------------------------|------------------------|
| Auth         | Unlimited               | ✅ No limit concern     |
| Firestore    | 50K reads, 20K writes/day | ✅ Well within limits  |
| Hosting      | 10 GB storage, 360 MB/day | ✅ Static assets only  |
| Functions    | ❌ Not available          | ⚠️ Needs Blaze plan   |

---

## Production Checklist

- [ ] `.env` file is NOT committed to git
- [ ] Firestore rules deployed: `firebase deploy --only firestore:rules`
- [ ] Firestore indexes deployed: `firebase deploy --only firestore:indexes`
- [ ] `google-services.json` placed in `android/app/` (not committed to git)
- [ ] Test OTP email flow end-to-end
- [ ] Test voice input on mobile Chrome
- [ ] Verify card wallet never shows/stores full card numbers
- [ ] Test on Android device (not just emulator)
- [ ] Set up monitoring in Firebase Console

---

*PisoWise — Para sa bawat Pilipinong nagnanais na maging matalino sa pera 🇵🇭*
