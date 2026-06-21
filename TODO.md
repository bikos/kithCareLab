# KithCare TODO List

## Database & Backend
- [ ] **Cascade Invite Deletion:** When a user profile is deleted, automatically cascade the deletion to their corresponding record in the `organization_invites` table. Currently, if a user is deleted but the invite remains, the UI fails silently when attempting to re-invite that same user (due to a unique constraint or lingering state).
- [ ] **Fix Infinite Loading on Set Password:** After successfully setting a new password from an invite, the "Save Password" button occasionally gets stuck with a spinning loading icon indefinitely instead of transitioning to the success state or redirecting. Investigate `handleUpdatePassword` for hanging `await` calls or silent unhandled promise rejections.

## Marketing & CRM Integrations (Future Steps)
- [ ] **Calendly / Cal.com Booking Link**: Update the Netlify `submission-created` function auto-reply email template to include a prominent booking button pointing to a Calendly or Cal.com scheduling link (enabling leads to schedule a demo immediately).
- [ ] **Lead Tracking Database Table (Supabase)**: Create a `leads` table in Supabase and insert form submission data directly from the Netlify serverless function to maintain a free, self-hosted lead database.
- [ ] **CRM Sync (HubSpot / Attio)**: Connect the Netlify function to Attio or HubSpot Contacts API to feed submissions directly into a sales pipeline.
