# KithCare TODO List

## Database & Backend
- [ ] **Cascade Invite Deletion:** When a user profile is deleted, automatically cascade the deletion to their corresponding record in the `organization_invites` table. Currently, if a user is deleted but the invite remains, the UI fails silently when attempting to re-invite that same user (due to a unique constraint or lingering state).
- [ ] **Fix Infinite Loading on Set Password:** After successfully setting a new password from an invite, the "Save Password" button occasionally gets stuck with a spinning loading icon indefinitely instead of transitioning to the success state or redirecting. Investigate `handleUpdatePassword` for hanging `await` calls or silent unhandled promise rejections.

## Marketing & CRM Integrations (Future Steps)
- [ ] **Calendly / Cal.com Booking Link**: Update the Netlify `submission-created` function auto-reply email template to include a prominent booking button pointing to a Calendly or Cal.com scheduling link (enabling leads to schedule a demo immediately).
- [ ] **Lead Tracking Database Table (Supabase)**: Create a `leads` table in Supabase and insert form submission data directly from the Netlify serverless function to maintain a free, self-hosted lead database.
- [ ] **CRM Sync (HubSpot / Attio)**: Connect the Netlify function to Attio or HubSpot Contacts API to feed submissions directly into a sales pipeline.
- [ ] **Cloudflare Web Analytics**: Integrate Cloudflare Web Analytics (free, privacy-friendly page visit tracking) by adding the Cloudflare tracking pixel script to the HTML templates.

## Search Engine Optimization (SEO)
- [ ] **Static Render Export**: Configure `app.json` for static web output.
- [ ] **Global Head Wrapper**: Implement `app/+html.tsx` with standard tags and Web Fonts.
- [ ] **Page Metadata Helmet**: Inject SEO titles, descriptions, and Open Graph / Twitter meta tags using `<Head>` inside `app/index.tsx`.
- [ ] **Semantic Web Headings**: Add `role="heading"` and `aria-level` accessibility attributes to `<Text>` headings in `app/index.tsx`.
- [ ] **Directives & Site Maps**: Add `public/robots.txt` and `public/sitemap.xml`.
