# Issue 003: Clinical Visit Form — Requires clinicianId URL Param (No Standalone Access)

## Category
- [x] UX / Navigation Bug
- [x] Architecture / Design Issue

## Severity
- [x] Major (Feature inaccessible via direct URL or FAB shortcut)

## Environment
- OS: Web
- Route: `/add/clinical-visit`

## Description
The `AddClinicalVisitScreen` form **requires both `clinicianId` AND `individualId`** as URL parameters (line 28 of `app/add/clinical-visit.tsx`):

```tsx
if (!clinicianId || !individualId) {
    Alert.alert('Error', 'Missing required information');
    return;
}
```

This means the clinical visit form can **only be accessed from `clinician-detail.tsx`** (where both params are passed), and there is no way to log a clinical visit directly from:
- The patient detail page's FAB menu
- The daily care log flow
- A direct URL with only `?individualId=...`

When accessed via `?individualId=28482b31-...` (without a `clinicianId`), the form renders and fills correctly, but clicking **"Save Visit Log"** shows an alert error and does NOT save.

## Steps to Reproduce
1. Navigate to `http://localhost:8081/add/clinical-visit?individualId=28482b31-ccc8-4803-a80a-8fb5e4abfeca`
2. Fill in Reason: "Routine checkup"
3. Fill in Notes: "All vitals normal"
4. Click "Save Visit Log"
5. **Result:** Alert pops up: "Missing required information" — nothing saves

## Expected Behavior
The form should either:
- Accept a visit without requiring a `clinicianId` (making it a standalone visit log for an individual), OR
- The UI should require the user to select a clinician from a dropdown/list **within** the form before allowing save

## Actual Behavior
The save button appears enabled, but tapping it shows an error dialog. There is no UI affordance to indicate `clinicianId` is missing — the form looks fully functional.

## Suggested Fix Steps
**Option A — Make clinicianId optional:**
```tsx
// In handleSubmit
if (!individualId) {
    Alert.alert('Error', 'Missing individual information');
    return;
}
// Remove clinicianId from required check
await addVisit({
    clinician_id: clinicianId || null,   // allow null
    individual_id: individualId,
    ...
});
```
Requires schema change to make `clinician_id` nullable in `clinical_visits` table.

**Option B — Add clinician picker inside the form:**
Add a `ClinicianSelector` dropdown to the form that lets the caregiver select an existing clinician for the individual, then pre-populate `clinicianId`.

**Option C — Remove the Clinical Visit item from the FAB menu if clinicianId is not available:**
Only show the "Log Clinical Visit" option in the FAB after first navigating into a clinician profile.
