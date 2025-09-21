const nodemailer = require('nodemailer');
require('dotenv').config();

async function testMailHog() {
  console.log('========================================');
  console.log('     MailHog Email Test Script');
  console.log('========================================\n');

  console.log('Configuration:');
  console.log('  Provider:', process.env.EMAIL_PROVIDER);
  console.log('  SMTP Host:', process.env.SMTP_HOST);
  console.log('  SMTP Port:', process.env.SMTP_PORT);
  console.log('  From:', process.env.EMAIL_FROM);
  console.log('  From Name:', process.env.EMAIL_FROM_NAME);
  console.log('\n========================================\n');

  try {
    // Create transporter for MailHog
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false,
      ignoreTLS: true
    });

    // Verify connection
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: 'customer@test.com',
      subject: `MailHog Test - ${new Date().toLocaleTimeString()}`,
      text: 'This is a plain text test email for MailHog verification.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #2c3e50; margin-bottom: 20px;">MailHog Test Email ✉️</h1>

            <p style="color: #555; line-height: 1.6;">
              This email confirms that your MailHog configuration is working correctly with the Backroom Leeds booking system.
            </p>

            <div style="background: #e8f4fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #3498db;">Test Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #777;">Environment:</td>
                  <td style="padding: 5px 0; color: #333; font-weight: bold;">${process.env.NODE_ENV || 'development'}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #777;">Timestamp:</td>
                  <td style="padding: 5px 0; color: #333; font-weight: bold;">${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #777;">SMTP Server:</td>
                  <td style="padding: 5px 0; color: #333; font-weight: bold;">${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated test email. No action required.
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                View all emails at: <a href="http://localhost:8025" style="color: #3498db;">http://localhost:8025</a>
              </p>
            </div>
          </div>
        </div>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('\n========================================');
    console.log('📧 View the email at: http://localhost:8025');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('   Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if MailHog is running:');
    console.error('     docker ps | grep mailhog');
    console.error('  2. Verify ports are accessible:');
    console.error('     telnet localhost 1025');
    console.error('  3. Check .env configuration');
    console.error('  4. Restart MailHog if needed:');
    console.error('     docker-compose -f docker-compose.dev.yml restart mailhog');
    process.exit(1);
  }
}

testMailHog();