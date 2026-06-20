# KithCare Admin Setup & Onboarding Guide

As a closed-ecosystem application, KithCare does not allow public sign-ups. All organizations and user accounts must be explicitly created or invited by administrators.

This document serves as the guide for setting up the initial admin environment and the flow for onboarding new organizations.

## 1. Creating the Initial Super Admin

Because there is no public sign-up, the very first "Super Admin" must be seeded manually into the database. This account will have the privileges required to log into the Super Admin portal and create the first organizations.

**Steps:**
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** -> **Users**.
3. Click **Add User** -> **Create new user** (Do not use the invite option).
4. Enter the email and password for the new Super Admin, and create the user.
5. Navigate to the **Table Editor** -> `profiles` table.
6. Locate the row for the newly created user.
7. Double-click the `is_super_admin` cell and set it to `TRUE`.
8. *(Optional)* Update the `full_name` cell in that same row to give the admin a proper display name.

## 2. Onboarding Organizations & Inviting Admins

Once the Super Admin exists, they can log into the Super Admin portal to create new Organizations. When an Organization is created, the system must invite the initial `org_admin` for that facility.

**The Invite Flow:**
1. The Super Admin creates the Organization via the portal.
2. The portal triggers the `invite-user` Edge Function.
3. Supabase sends an automated email to the new `org_admin`.
4. The user clicks the link in the email, which redirects them to the application to set their password.

### ⚠️ Critical Edge Function Configuration

The redirect URL that the user lands on after clicking the email link is hardcoded in the `supabase/functions/invite-user/index.ts` file.

*   **Local Development:** Set `redirectTo: 'http://localhost:8081/dashboard'`
*   **Production/Dev Environment:** When deploying the app to a live URL, you **must** update the Edge Function to point to the correct domain (e.g., `https://app.kithcarelab.com/dashboard`) and re-deploy it:
    ```bash
    npx supabase functions deploy invite-user
    ```

*Note: Ensure the target URL is also added to the **Redirect URLs** allowlist in your Supabase Authentication settings, otherwise Supabase will block the handoff.*
