# UAAMS — University Administration & Application Management System

A web-based platform that digitises and streamlines the university admissions process for both students and administrators.

**Live site:** https://university-application-system-ten.vercel.app

---

## What it does

**For students**
- Register an account and submit a university application
- Upload supporting documents (passport, transcripts, certificates)
- Track application status in real time
- Receive email notifications at every stage

**For administrators**
- View and manage all incoming applications from a central dashboard
- Filter by status, search by student name or application ID
- Review student documents and update application status
- Add notes and send decisions to applicants

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React |
| Backend | Next.js API Routes |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| File Storage | Firebase Storage |
| Email System | Custom SMTP (mock) + Firestore logging |
| Testing | Vitest |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AdminSystem-Group5/university-application-system.git
cd university-application-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests

```bash
npm test
```

Runs 7 automated tests across 3 files:
- `application.workflow.test.js` — FSM status transition logic
- `email.service.test.js` — email template building
- `api.routes.test.js` — API endpoint integration

---

## Pushing New Work

Always pull before you push:

```bash
git pull origin main
git add .
git commit -m "describe what you changed"
git push origin main
```

Vercel automatically redeploys on every push to `main`.

---

## Project Structure

```
src/
├── app/                  # Pages and API routes
│   ├── admin/            # Admin dashboard
│   ├── student/          # Student portal
│   ├── api/              # Email, notifications, applications
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── components/           # Reusable UI components
│   └── emails/           # HTML email templates
├── functions/            # Firebase triggers and SMTP client
├── lib/                  # Firebase config and services
└── tests/                # Unit and integration tests
    ├── unit/
    └── integration/
```

---

## Group 6 — Team

| Name | Role |
|---|---|
| Valerio Gerardi | Project Manager |
| Carmen Csatlos | Frontend — Student Portal |
| Lavinia Ciobanescu | Backend — Firebase & Database |
| Anton Martinov | Admin Module |
| Andreea Lucaci | Email System, Testing & Deployment |
| Fakhrul Islam | API Testing & Future Enhancements |

**Module:** QHO635  
**Client:** Shiv Raj Banjade  
**Tutor:** Muhammad Akram
