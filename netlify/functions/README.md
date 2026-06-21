# Netlify Functions - Form Auto-Responder

This directory contains Netlify Serverless Functions that execute on server-side triggers.

## `submission-created.js`
This background function is automatically triggered by Netlify whenever a new form submission is received. It is configured specifically for the contact form to dispatch a styled HTML receipt confirmation email directly to the submitter using the **Resend API**.

---

## How It Works
1. **Trigger**: Netlify detects a submission for a form with `name="contact"`.
2. **Payload Parsing**: The function receives the submitter's form data (`name`, `email`, `role`, `phone`, `message`).
3. **Email Dispatch**: The function makes a POST request to Resend's transactional API (`https://api.resend.com/emails`) using native Node.js `fetch`.
4. **Replies Routing**: The recipient is sent the email from your domain address, but any replies they compose will be automatically redirected to your personal inbox using the `reply_to` header.

---

## Configuration & Environment Variables

To make this function work, you must define the following environment variable in the **Netlify Dashboard** under **Site settings > Environment variables**:

| Environment Variable | Description |
|----------------------|-------------|
| `RESEND_API_KEY` | Your Resend API Key (which looks like `re_12345...`). |

*Note: You do not need to install `resend` or `node-fetch` as npm packages since this function uses the native Node 18+ global `fetch` API directly.*

---

## Customizing Email Headers (For Future Use)

You can customize where the email is sent from and where replies are routed by editing the Resend payload at the bottom of [submission-created.js](file:///Users/bikos/Documents/kithcarelab/netlify/functions/submission-created.js):

```javascript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'KithCare Team <hello@yourdomain.com>', // 1. Custom Sender Address (Must be verified in Resend)
    to: [email],                                // 2. Submitter's email address
    reply_to: 'yourpersonalemail@gmail.com',     // 3. Where you want replies to go
    subject: 'Thanks for contacting KithCare!',
    html: emailHtml
  })
});
```

### 1. `from` (Sender)
This address must use a domain that is verified in your **Resend Dashboard** (e.g. `yourdomain.com`). You can change the prefix (e.g., from `hello@` to `info@` or `contact@`) as long as the domain is verified.

### 2. `reply_to` (Replies Routing)
This is the email address that will receive replies when users click "Reply" to the receipt email. It can be any address (e.g. your Gmail, a team support inbox, etc.) and does **not** need to be hosted on your verified domain.

---

## Customizing the Email Template
The email design is declared in the `emailHtml` constant string. You can modify:
- **Styling**: The CSS is located inside the `<style>` tag in the template. Modify colors (e.g. `#00695C` is our primary green) and branding styles here.
- **Content**: Edit the text paragraphs or modify what form fields are shown in the summary table.

---

## Testing Locally
To test this serverless function locally using the Netlify CLI:
1. Start the dev server:
   ```bash
   netlify dev
   ```
2. Trigger the submission function using the Netlify CLI utility:
   ```bash
   netlify functions:trigger submission-created
   ```
