# Issue 001: Cascade Delete — Re-inviting a Deleted Staff Member Fails Silently

## Category
- [x] Database / Persistence Bug

## Severity
- [x] Major (Core feature broken, workaround required)

## Environment
- OS: Web / Mac
- Route: `/dashboard/staff`

## Description
When a staff member's profile is deleted (via the "Delete Member" action on the Staff page), the corresponding record in the `organization_invites` table is **not deleted**. As a result, attempting to re-invite the same email address fails silently or errors — because the invite row already exists with a unique constraint on the email, causing the insert to fail without a user-visible error message.

## Steps to Reproduce
1. Log in as admin (`riderstorm95@gmail.com` / `1234567`)
2. Go to `/dashboard/staff`
3. Delete an existing staff member (e.g., `bikone2000@gmail.com`)
4. Click "Invite Staff" and enter the same email address
5. Observe: the invite appears to send (no UI error shown), but the staff member is NOT added and the invite table still holds the old row

## Expected Behavior
The invite should either:
- Succeed by upsert-ing the existing row, OR
- A cascade delete on `profiles` should also delete the `organization_invites` row

## Actual Behavior
The invite silently fails. The `organization_invites` row for the old email persists. If the user checks the pending invites table, the deleted member's email may still show.

## Database Context
Table: `organization_invites`  
Relevant columns: `email`, `organization_id`, `status`  
The `organization_invites` table is NOT linked to `profiles` with a cascade delete foreign key. Deleting a profile does not remove the associated invite row.

## Suggested Fix Steps
**Option A — Add cascade delete FK from invites to profiles:**
```sql
ALTER TABLE organization_invites
ADD COLUMN profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
```
Populate `profile_id` from existing data, then enforce it.

**Option B — Upsert on invite (simpler short-term fix):**
In the `inviteMember` store function, use `upsert` with `onConflict: 'email,organization_id'` instead of a plain `insert`, so re-inviting the same email updates the existing row instead of failing.

**Option C — Clean up invite row when deleting a member (app-level fix):**
In `deleteMember()` in `organizationStore.ts`, after deleting the profile, also run:
```ts
await supabase.from('organization_invites').delete().eq('email', member.profile.email).eq('organization_id', org.id);
```
