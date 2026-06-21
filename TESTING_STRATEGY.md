# KithCare E2E Manual & Smoke Testing Strategy

This document outlines the standard reusable strategy for performing E2E manual and smoke tests on the KithCare platform. Use this process before major deployments, after significant refactoring, or as part of a formal discovery phase to ensure code quality and UI/UX consistency across all roles and flows.

---

## 📋 Table of Contents
1. [Core Principles](#1-core-principles)
2. [Prerequisites & Environment Setup](#2-prerequisites--environment-setup)
3. [Test Roles & Authentication Matrices](#3-test-roles--authentication-matrices)
4. [Step-by-Step Navigation Checklist](#4-step-by-step-navigation-checklist)
5. [Database-Side Action Verification](#5-database-side-action-verification)
6. [Issue Documentation & Bug Reporting](#6-issue-documentation--bug-reporting)
7. [Verification Reports & Screenshots](#7-verification-reports--screenshots)

---

## 1. Core Principles

- **Zero-Code-Change Discovery:** The testing phase is strictly for discovery. Do not modify source code or attempt automatic fixes during a test run. Document issues first and review them before applying PRs.
- **Visual Evidence:** Every main route, form, and successful action must be documented with a screenshot to provide clear visual validation.
- **Supabase Integrity:** Every client-side write operation (create, update, delete) must be verified against the Supabase database. Do not rely solely on the UI displaying success.
- **Device & Viewport Responsiveness:** Since the app is built with Expo React Native Web, test on both **Desktop** (1280px+ width) and **Mobile/Tablet** (under 768px width) viewports.

---

## 2. Prerequisites & Environment Setup

### Local Server Setup
1. Verify no existing processes are hogging the Expo port (default `8081`):
   ```bash
   lsof -i :8081
   ```
2. Start the local web development server:
   ```bash
   npm run web
   # or: npx expo start --web
   ```
3. Ensure the browser is open and navigating to `http://localhost:8081`.

### Supabase CLI / Client Check
- Ensure your local `.env` has the correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Confirm access to the Supabase Project Dashboard or have the Supabase MCP / CLI active to run verification queries.

---

## 3. Test Roles & Authentication Matrices

KithCare acts differently depending on the user's role:

| Role | Target Route | Core Responsibilities |
|---|---|---|
| **Admin (`isOrgAdmin`)** | `/dashboard/*` | Staff management, invitations, client profiles, and reporting. |
| **Caregiver / Staff** | `/(tabs)/*` | Daily log entries, medication tracking, work notes, and profile editing. |

### Test Credentials
When testing, use standard test accounts defined in your project environment (e.g. `riderstorm95@gmail.com` with password `1234567`).

---

## 4. Step-by-Step Navigation Checklist

### Step 4.1: Authentication & Landing Page
- [ ] **Direct Launch:** Visit `http://localhost:8081`. Verify the landing page is fully rendered, and links like "Get Started" or "Log In" redirect to `/auth/login`.
- [ ] **Login Screen:** Input invalid credentials to verify error handling/alert states.
- [ ] **Successful Login:** Input valid credentials. Verify smooth redirection to the correct portal based on role.
- [ ] **Forgot Password Flow:** Click the link on the login page. Input email, verify request state, and check routing.

### Step 4.2: Admin Portal (`/dashboard`)
- [ ] **Dashboard Index (`/dashboard/index.tsx`):**
  - Verify stats cards load data correctly (Total Staff, Total Clients, Active Shifts).
  - Verify layout looks clean on both wide and narrow screen sizes.
- [ ] **Clients Management (`/dashboard/clients.tsx`):**
  - Verify client list displays active names.
  - Search for a specific client; verify immediate filtering.
  - Navigate to "Add Client" (`/add-client.tsx`). Fill in all fields (Name, Sex, DOB, Emergency Contact) and submit. **(Verify DB write)**.
  - Navigate to a client's detail page (`/client-detail.tsx` or `/dashboard/client-detail.tsx`). Verify info displays correctly.
  - Open "Edit Client" (`/edit-client.tsx`). Update fields and submit. **(Verify DB write)**.
- [ ] **Staff Management (`/dashboard/staff.tsx`):**
  - Verify listing of existing staff and pending invites.
  - Invite a new staff member. Input email and click invite. **(Verify DB write in `organization_invites`)**.
  - Navigate to "Staff Detail" (`/dashboard/staff-detail.tsx`). Verify staff status, shifts, and profile details.
- [ ] **Reports (`/dashboard/reports.tsx`):**
  - Load reports. Verify filter dropdowns (date ranges, clients, staff).
  - Test generating/exporting a sample report.

### Step 4.3: Caregiver Portal (`/(tabs)`)
- [ ] **Caregiver Home (`/(tabs)/index.tsx`):**
  - Verify the active client selection dropdown.
  - Verify recent activity stream is rendering.
- [ ] **Medications Tab (`/(tabs)/medications.tsx`):**
  - Verify list of prescribed medications for the active client.
  - Click "Add Medication" (`/add/medication.tsx`). Enter name, dosage, schedule, frequency. Submit and verify.
- [ ] **Work Notes Tab (`/(tabs)/work-notes.tsx`):**
  - Verify work notes feed.
  - Test searching work notes by title or content.
  - Filter using segmented buttons (All / Active / Resolved).
  - Click "Add Work Note" (`/add-work-note.tsx`). Add title, body, category, priority, and select a client. Submit and verify.
- [ ] **Profile Tab (`/(tabs)/profile.tsx`):**
  - Verify current caregiver details.
  - Open the "Edit Profile" modal. Update name and phone number. Submit.
  - Tap the avatar to upload a new profile picture. Verify resizing and upload success.

### Step 4.4: Daily Logs & Sub-Forms (`/add/*`)
Open client details and test logs addition:
- [ ] **Daily Log (`/add/daily-log.tsx`):** Fill out mood, sleep, appetite, activities. Submit and verify.
- [ ] **Journal (`/add/journal.tsx`):** Attach image, write caption, write body. Submit and verify.
- [ ] **Meal (`/add/meal.tsx`):** Log meal type, items consumed, percentage eaten. Submit and verify.
- [ ] **Clinical Visit (`/add/clinical-visit.tsx`):** Enter provider, notes, vitals. Submit and verify.
- [ ] **Document (`/add/document.tsx`):** Upload a file (PDF/Image) with a title/description. Submit and verify.

---

## 5. Database-Side Action Verification

Do not assume a write succeeded just because the UI returned a success message. Always execute matching verification queries on the database.

### 5.1 Verification Query Matrix

| UI Action | Target Table | Verification Query |
|---|---|---|
| **Add Client** | `individuals` | `SELECT * FROM individuals WHERE name = 'TEST_NAME' LIMIT 1;` |
| **Invite Staff** | `organization_invites` | `SELECT * FROM organization_invites WHERE email = 'TEST_EMAIL' LIMIT 1;` |
| **Add Medication** | `medications` | `SELECT * FROM medications WHERE name = 'TEST_MED' LIMIT 1;` |
| **Add Work Note** | `work_notes` | `SELECT * FROM work_notes WHERE title = 'TEST_TITLE' LIMIT 1;` |
| **Add Journal** | `journal_entries` | `SELECT * FROM journal_entries WHERE caption = 'TEST_CAPTION' LIMIT 1;` |
| **Daily Log** | `daily_logs` | `SELECT * FROM daily_logs ORDER BY created_at DESC LIMIT 1;` |

*Note: Clean up test entries in the database after the smoke test is fully verified.*

---

## 6. Issue Documentation & Bug Reporting

When an issue, bug, crash, or unexpected behavior is found:
1. Do **NOT** modify codebase files during the test run.
2. Create a markdown issue file under `/Users/bikos/Documents/kithcarelab/issues/`.
3. Follow the issue template below.

### Issue File Naming Convention
`issues/issue-[ID]-[kebab-case-description].md`  
*(Example: `issues/issue-001-cascade-delete-organization-invites.md`)*

### Issue Template
```markdown
# Issue [ID]: [Short, Descriptive Title]

## Category
- [ ] UI / Layout Error
- [ ] Crash / Exception
- [ ] Database / Persistence Bug
- [ ] Navigation / Routing Issue
- [ ] UX / Usability Improvement

## Severity
- [ ] Critical (App crash, login block, data loss)
- [ ] Major (Core feature broken, workaround required)
- [ ] Minor (Visual glitch, bad formatting, non-blocking UI bug)

## Environment
- OS: Mac / Web
- Viewport Size: Desktop (1280px) / Mobile (375px)
- URL/Route: `/dashboard/clients`

## Description
Provide a clear description of the behavior and context.

## Steps to Reproduce
1. Log in as admin
2. Go to ...
3. Click on ...
4. Observe ...

## Expected Behavior
What should have happened.

## Actual Behavior
What actually happened (include screenshots if visual).

## Database Context (if applicable)
Supabase table status, logs, or error codes returned.

## Suggested Fix Steps
Outline the files to modify and the exact code changes needed to address the bug.
```

---

## 7. Verification Reports & Screenshots

At the end of the test run, compile all findings into a final `walkthrough.md` in the project root:
1. **Summary Table:** A dashboard of tested components (Pass/Fail).
2. **Discovered Issues:** Links to all newly created issue files.
3. **Visual Gallery:** Stitched screenshots of every main layout.
4. **Database Verification Logs:** Raw output of verifying SQL commands.
