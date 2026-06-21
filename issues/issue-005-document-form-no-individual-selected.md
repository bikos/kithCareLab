# Issue 005: Document Form — Shows "No individual selected" When Navigated Directly via URL

## Category
- [x] State Management Bug
- [x] UX / Navigation Bug

## Severity
- [x] Major (Feature completely blocked — cannot upload a document via direct URL)

## Environment
- OS: Web
- Route: `/add/document?individualId=...`

## Description
The Document Upload form (`app/add/document.tsx`) checks `currentProfile` from the `useCaregiverStore` to verify an individual is selected. However, `currentProfile` is populated by **clicking on a patient from the app's navigation flow**, not by reading the `individualId` URL parameter.

When navigated to via direct URL (`/add/document?individualId=28482b31-...`), the store `currentProfile` is still `null`, so the form renders:

```
No individual selected
```

And the upload form is never shown — completely blocked.

## Steps to Reproduce
1. Open a fresh browser tab / refresh the page
2. Log in as caregiver (`bikone2000@gmail.com` / `1234567`)
3. Navigate directly to: `http://localhost:8081/add/document?individualId=28482b31-ccc8-4803-a80a-8fb5e4abfeca`
4. **Result:** Page shows "No individual selected" with a blank screen — no form rendered

## Expected Behavior
The document form should render for the individual identified by `individualId` URL param, just like the Meal form does (which correctly uses `useLocalSearchParams` for `individualId`).

## Actual Behavior
Blank page with "No individual selected" message. The form is completely hidden.

## Root Cause
The document form reads the patient from the caregiver store state instead of URL params:
```tsx
// In app/add/document.tsx (WRONG — relies on store state)
const { currentProfile } = useCaregiverStore();
// ...
if (!currentProfile) {
    return <View><Text>No individual selected</Text></View>;
}
```

Compare to the **correct** approach in `app/add/meal.tsx`:
```tsx
// In app/add/meal.tsx (CORRECT — reads from URL)
const { individualId } = useLocalSearchParams<{ individualId: string }>();
```

## Suggested Fix
In `app/add/document.tsx`, change to read from URL params:
```tsx
import { useLocalSearchParams } from 'expo-router';

const { individualId } = useLocalSearchParams<{ individualId: string }>();

// Guard on individualId instead of currentProfile
if (!individualId) {
    return <View><Text>No individual selected</Text></View>;
}

// In handleSubmit, pass individualId to uploadDocument
await uploadDocument(title, 'Medical', selectedFile.uri, individualId);
```
And update `uploadDocument` in `documentStore.ts` to accept and use `individualId`.
