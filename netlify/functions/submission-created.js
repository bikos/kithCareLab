/**
 * Netlify Background Function for 'submission-created' event.
 * Automatically runs on successful form submission.
 */

exports.handler = async function (event, context) {
  try {
    console.log('[Submission Created] Triggered');
    if (!event.body) {
      console.log('[Submission Created] Error: No event body');
      return { statusCode: 400, body: 'No event body' };
    }

    const { payload } = JSON.parse(event.body);
    if (!payload || !payload.data) {
      console.log('[Submission Created] Error: Invalid payload structure');
      return { statusCode: 400, body: 'Invalid payload structure' };
    }

    // Only handle our contact form
    if (payload.form_name !== 'contact') {
      console.log(`[Submission Created] Ignoring form: ${payload.form_name}`);
      return { statusCode: 200, body: `Ignored form: ${payload.form_name}` };
    }

    const name = payload.data.name || 'there';
    const email = payload.data.email;
    const role = payload.data.role || 'Visitor';
    const phone = payload.data.phone || '';
    const message = payload.data.message || '';

    console.log(`[Submission Created] Form Details - Name: ${name}, Email: ${email}, Role: ${role}`);

    if (!email) {
      console.log('[Submission Created] Error: Submitter email is missing');
      return { statusCode: 400, body: 'Submitter email is missing' };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.log('[Submission Created] Error: RESEND_API_KEY environment variable is not defined');
      return { statusCode: 500, body: 'RESEND_API_KEY env variable is missing' };
    }

    // Beautiful custom email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thanks for reaching out!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      line-height: 1.6;
      background-color: #F8FAFC;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 580px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #004D40 0%, #00796B 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #FFFFFF;
      font-size: 24px;
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 32px;
    }
    .content p {
      font-size: 16px;
      color: #334155;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .details {
      background: #F1F5F9;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .details h3 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748B;
    }
    .details table {
      width: 100%;
      border-collapse: collapse;
    }
    .details td {
      padding: 6px 0;
      vertical-align: top;
    }
    .details-label {
      font-weight: 600;
      color: #475569;
      width: 120px;
    }
    .details-value {
      color: #0F172A;
    }
    .button-container {
      text-align: center;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-block;
      background-color: #00695C;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 12px 28px;
      font-weight: 600;
      border-radius: 8px;
      font-size: 16px;
    }
    .footer {
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #94A3B8;
    }
    .footer a {
      color: #00695C;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KithCare</h1>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>Thank you for reaching out to KithCare! We have received your message and our team is already reviewing it. We typically get back to you within 24 hours.</p>
      
      <div class="details">
        <h3>Your Submission Details</h3>
        <table>
          <tr>
            <td class="details-label">Role:</td>
            <td class="details-value">${role}</td>
          </tr>
          ${phone ? `
          <tr>
            <td class="details-label">Phone:</td>
            <td class="details-value">${phone}</td>
          </tr>
          ` : ''}
          ${message ? `
          <tr>
            <td class="details-label">Message:</td>
            <td class="details-value" style="font-style: italic;">"${message}"</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p>In the meantime, feel free to visit our website to explore our caregiver tools and learn more about our client management platform.</p>
      
      <div class="button-container">
        <a href="https://kithcarelab.com" class="btn" style="color: #FFFFFF;">Visit KithCare</a>
      </div>
      
      <p>Best regards,<br><strong>The KithCare Team</strong></p>
    </div>
    <div class="footer">
      &copy; 2026 KithCare. All rights reserved.<br>
      If you did not make this request, please ignore this email.
    </div>
  </div>
</body>
</html>
        `;

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'KithCare Team <hello@kithcarelab.com>',
        to: [email],
        reply_to: 'kithcarelab@gmail.com',
        subject: 'Thanks for contacting KithCare!',
        html: emailHtml
      })
    });

    const resBody = await response.text();
    console.log(`[Submission Created] Resend Response status: ${response.status}, body: ${resBody}`);

    if (!response.ok) {
      throw new Error(`Resend API returned error status: ${response.status} - ${resBody}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Auto-reply sent successfully' })
    };

  } catch (error) {
    console.error('[Submission Created] Error sending auto-reply email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
