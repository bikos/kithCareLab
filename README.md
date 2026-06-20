# KithCare 💙

Compassionate care, beautifully organized. KithCare is a modern, cross-platform application (Web, iOS, Android) built with Expo Router and Supabase, designed for managing residents, staff, and care operations securely.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project & Credentials

### Running Locally
To spin up the local development server (with the interactive Expo menu):
```bash
npm start
```
To run the web application directly:
```bash
npm run web
```
*(Note: If you are logged into an active session, the app will securely route you past the landing page straight to the dashboard. To view the landing page, sign out or use an Incognito window).*

## 🌍 Deployment

### Web Deployment (Netlify)

This repository is fully configured for zero-downtime deployment to Netlify.

**1. Automatic CI/CD Deployments (GitHub Integration)**
The repository contains a `netlify.toml` configuration file. If the project is linked to Netlify via GitHub, Netlify will **automatically build and deploy** your site to production every single time you push code to the `main` branch. No manual intervention required!

```bash
git add .
git commit -m "Update feature"
git push origin main
```

**Understanding `netlify.toml`:**
The `netlify.toml` file is the master configuration file that Netlify reads when building the app. It instructs Netlify on three critical things:
1. **Build Command (`npm run build:web`)**: Tells Netlify exactly how to bundle the Expo project.
**2. Manual One-Click Deploy**
If you need to forcefully push a manual update to Netlify straight from your local terminal, we have created a custom script that bundles the app and deploys the `dist` directory:
```bash
npm run deploy:web
```

**3. Environment Variables (Required!)**
A common issue during deployment is a "blank white screen". Because Netlify builds the app on their secure servers, they do not have access to your local `.env` file. You **must** manually enter your Supabase credentials into the Netlify Dashboard before the app can render successfully.

1. Go to your Netlify Dashboard -> **Site Configuration** -> **Environment variables**.
2. Add the following keys exactly as they appear in your local `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Save** and trigger a fresh deployment!

*Routing Note:* KithCare uses Expo Router (a Single Page Application). To prevent 404 errors on direct URL visits, the build process injects a `public/_redirects` file to route all traffic securely to `index.html`.

### Mobile Deployment (EAS)

For native mobile applications (iOS / Android), we use Expo Application Services (EAS). Build commands are pre-configured in `package.json`:
- **Android APK (Local/Preview):** `npm run build:apk`
- **Android AAB (Production):** `npm run build:production`
- **iOS IPA (Production):** `npm run build:ios-prod`

### Backend Deployment (Supabase Edge Functions)

KithCare uses Supabase Edge Functions for secure backend tasks (e.g., dispatching email invites via Resend). If you modify the code in the `supabase/functions/` directory, you must push the changes to Supabase manually using the CLI:

```bash
npx supabase functions deploy invite-user
```
*(If prompted, log in with your Supabase credentials or use your Supabase Access Token).*

## 🔒 Authentication & Security

KithCare relies on Supabase Auth. The system utilizes protected routing via Expo Router (`app/_layout.tsx`). The app actively listens for session states, invite links, and password recovery hashes to automatically direct users to the appropriate secure portals based on their administrative clearance (`profiles` and `organization_members` tables).

## 🎨 Styling & Design System

The web interface utilizes premium, ADA-compliant styling including:
- High-end Apple-style Glassmorphism (`backdrop-filter: blur()`).
- Soft pastel mesh gradients for modern, airy light modes.
- Responsive breakpoints to serve optimized layouts for both Desktop Administrators and Mobile Field Agents.
