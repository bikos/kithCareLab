/**
 * Netlify Background Function for 'submission-created' event.
 * Automatically runs on successful form submission.
 * Sends:
 * 1. A welcome/auto-reply email to the customer (submitter).
 * 2. A beautifully formatted HTML table notification to the admin.
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

    // 1. Beautiful custom email HTML template for Customer Auto-Reply
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

    // 2. Beautiful custom email HTML template for Admin Notification
    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Lead Captured</title>
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
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #004D40 0%, #00796B 100%);
      padding: 24px 32px;
      color: #FFFFFF;
    }
    .header h1 {
      font-size: 20px;
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: #FFFFFF;
    }
    .content {
      padding: 32px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #00695C;
      margin-top: 0;
      margin-bottom: 16px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    td {
      padding: 10px 12px;
      vertical-align: top;
      font-size: 15px;
      border-bottom: 1px solid #F1F5F9;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #475569;
      width: 160px;
      background-color: #F8FAFC;
    }
    .value {
      color: #0F172A;
    }
    .message-box {
      background: #F1F5F9;
      border-radius: 8px;
      padding: 16px;
      font-style: italic;
      color: #334155;
      margin-bottom: 28px;
      font-size: 15px;
      border-left: 4px solid #00695C;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Lead: ${name}</h1>
    </div>
    <div class="content">
      <div class="section-title">Lead Profile</div>
      <table>
        <tr>
          <td class="label">Name</td>
          <td class="value">${name}</td>
        </tr>
        <tr>
          <td class="label">Email</td>
          <td class="value"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td class="label">Phone</td>
          <td class="value">${phone || 'Not provided'}</td>
        </tr>
        <tr>
          <td class="label">Role</td>
          <td class="value">${role}</td>
        </tr>
        <tr>
          <td class="label">Submitted At</td>
          <td class="value">${payload.created_at || new Date().toISOString()}</td>
        </tr>
      </table>

      ${message ? `
      <div class="section-title">Message</div>
      <div class="message-box">"${message}"</div>
      ` : ''}

      <div class="section-title">Attribution & UTM Data</div>
      <table>
        <tr>
          <td class="label">Lead Source</td>
          <td class="value">${payload.data.lead_source || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Referrer</td>
          <td class="value" style="word-break: break-all;">${payload.data.referrer || 'Direct'}</td>
        </tr>
        <tr>
          <td class="label">Page URL</td>
          <td class="value" style="word-break: break-all;">${payload.data.page_url || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">UTM Source</td>
          <td class="value">${payload.data.utm_source || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">UTM Medium</td>
          <td class="value">${payload.data.utm_medium || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">UTM Campaign</td>
          <td class="value">${payload.data.utm_campaign || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">UTM Term</td>
          <td class="value">${payload.data.utm_term || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">UTM Content</td>
          <td class="value">${payload.data.utm_content || 'N/A'}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
    `;

    // A. Send Auto-Reply to customer via Resend API
    console.log('[Submission Created] Sending auto-reply to customer...');
    const customerResponse = await fetch('https://api.resend.com/emails', {
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

    const custResBody = await customerResponse.text();
    console.log(`[Submission Created] Customer Auto-reply status: ${customerResponse.status}, body: ${custResBody}`);

    // B. Send Table-Formatted notification to Admin via Resend API
    console.log('[Submission Created] Sending table-formatted notification to Admin...');
    const adminResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'KithCare Leads <hello@kithcarelab.com>',
        to: ['kithcarelab@gmail.com'],
        reply_to: email, // Directly reply to the lead's email
        subject: `New Lead: ${name} - ${role}`,
        html: adminEmailHtml
      })
    });

    const adminResBody = await adminResponse.text();
    console.log(`[Submission Created] Admin Notification status: ${adminResponse.status}, body: ${adminResBody}`);

    if (!customerResponse.ok || !adminResponse.ok) {
      throw new Error(
        `Resend API returned error. Customer response ok: ${customerResponse.ok}, Admin response ok: ${adminResponse.ok}`
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Auto-reply and Admin notification sent successfully' })
    };

  } catch (error) {
    console.error('[Submission Created] Error processing submission emails:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
