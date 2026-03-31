# Firebase Setup Guide for UAAMS

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `uaams-dev` (or your preferred name)
4. Disable Google Analytics (optional for development)
5. Click **Create project**

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. (Optional) Enable **Email link (passwordless sign-in)**

## Step 3: Create Firestore Database

1. Go to **Build > Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select your region (e.g., `europe-west2` for UK)
5. Click **Enable**

## Step 4: Enable Storage

1. Go to **Build > Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select your region
5. Click **Done**

## Step 5: Get Your Firebase Config

1. Go to **Project settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web** icon (`</>`)
4. Register app with nickname: `uaams-web`
5. Copy the config values

Your config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 6: Add Environment Variables

In v0, click on **Vars** in the sidebar and add these:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Your authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Your storageBucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your messagingSenderId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your appId |

## Step 7: Deploy Security Rules

### Option A: Firebase Console (Easiest)

1. Go to **Firestore Database > Rules**
2. Copy contents from `firebase/firestore.rules`
3. Click **Publish**

4. Go to **Storage > Rules**
5. Copy contents from `firebase/storage.rules`
6. Click **Publish**

### Option B: Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select your project)
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage
```

## Step 8: Create Indexes

1. Go to **Firestore Database > Indexes**
2. Click **Add index** for each index in `firebase/firestore.indexes.json`

Or deploy via CLI:
```bash
firebase deploy --only firestore:indexes
```

## Step 9: Seed Initial Data (Optional)

Run the seed script to populate test data:
```bash
npx ts-node scripts/seed-database.ts
```

---

## Quick Reference: Collections Structure

```
firestore/
├── users/           # User accounts and profiles
├── universities/    # University information and admin IDs
├── applications/    # Student applications
├── documents/       # Uploaded document metadata
└── notifications/   # User notifications
```

## Troubleshooting

### "Missing required Firebase environment variables"
- Check that all NEXT_PUBLIC_ variables are set in v0 Vars section
- Restart the preview after adding variables

### "Permission denied" errors
- Ensure security rules are deployed
- Check that user is authenticated
- Verify user role matches required access level

### "Index not found" errors
- Create the required composite index (Firebase will show a link)
- Or deploy all indexes via CLI

---

## For Your Team

Share this Firebase project with your team members:
1. Go to **Project settings > Users and permissions**
2. Click **Add member**
3. Enter their email and assign **Editor** role
