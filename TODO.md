# KithCare TODO List

## Database & Backend
- [ ] **Cascade Invite Deletion:** When a user profile is deleted, automatically cascade the deletion to their corresponding record in the `organization_invites` table. Currently, if a user is deleted but the invite remains, the UI fails silently when attempting to re-invite that same user (due to a unique constraint or lingering state).
- [ ] **Fix Infinite Loading on Set Password:** After successfully setting a new password from an invite, the "Save Password" button occasionally gets stuck with a spinning loading icon indefinitely instead of transitioning to the success state or redirecting. Investigate `handleUpdatePassword` for hanging `await` calls or silent unhandled promise rejections.
