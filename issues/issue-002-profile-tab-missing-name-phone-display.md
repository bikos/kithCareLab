# Issue 002: Profile Tab — Missing Edit Controls for Full Name and Phone

## Category
- [x] UX / Usability Improvement

## Severity
- [x] Minor (Visual glitch, bad formatting, non-blocking UI bug)

## Environment
- OS: Web
- Viewport Size: Desktop (1512px)
- Route: `/(tabs)/profile`

## Description
The Profile tab (`/(tabs)/profile`) for the caregiver view does **not show the Full Name or Phone Number** fields in the main profile view — only the avatar initials, email address, role badge ("CAREGIVER"), and settings links are visible. The "Edit Profile" flow does allow editing the name (confirmed by name update from `nurse nurse` → `Nurse Care E2E` persisting correctly in the DB and UI), but the phone number field update does **not visually render** on the profile after saving.

Furthermore, the profile page does not display:
- The updated phone number after editing
- A dedicated "Full Name" display field (only the avatar initials and email are shown)

## Steps to Reproduce
1. Log in as caregiver (`bikone2000@gmail.com` / `1234567`)
2. Go to the Profile tab (`/(tabs)/profile`)
3. Tap the settings gear (⚙️) to open Edit Profile
4. Enter a phone number (e.g., `555-0123`) in the phone field
5. Click "Save"
6. Return to the Profile tab
7. Observe: Phone number does not appear anywhere on the profile display

## Expected Behavior
The profile page should show the caregiver's:
- Full Name (prominently, not just as avatar initials)
- Email
- Phone Number
- Role badge

## Actual Behavior
Only email and role badge are shown. Phone number field is absent. The name is only shown as avatar initials.

## Suggested Fix Steps
In `app/(tabs)/profile.tsx`, add explicit display rows for Full Name and Phone under the "Account Information" section:
```tsx
<List.Item
  title="Full Name"
  description={profile?.full_name || 'Not set'}
  left={(props) => <List.Icon {...props} icon="account" />}
/>
<List.Item
  title="Phone"
  description={profile?.phone || 'Not set'}
  left={(props) => <List.Icon {...props} icon="phone" />}
/>
```
