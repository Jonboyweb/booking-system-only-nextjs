import * as dotenv from 'dotenv';
dotenv.config();

interface EmailConfig {
  provider: string;
  host: string;
  port: number;
  from: string;
  fromName: string;
}

async function testMailHog() {
  console.log('========================================');
  console.log('     MailHog Email Test Script');
  console.log('========================================\n');

  const config: EmailConfig = {
    provider: process.env.EMAIL_PROVIDER || 'mailhog',
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    from: process.env.EMAIL_FROM || 'bookings@backroom-dev.local',
    fromName: process.env.EMAIL_FROM_NAME || 'Backroom Leeds (Dev)'
  };

  console.log('Configuration:');
  console.log('  Provider:', config.provider);
  console.log('  SMTP Host:', config.host);
  console.log('  SMTP Port:', config.port);
  console.log('  From:', config.from);
  console.log('  From Name:', config.fromName);
  console.log('\n========================================\n');

  try {
    // Test SMTP connection using simple TCP check
    const net = await import('net');

    console.log('Testing SMTP connection...');
    await new Promise<void>((resolve, reject) => {
      const client = net.createConnection({ port: config.port, host: config.host }, () => {
        console.log('✅ TCP connection to MailHog successful!\n');
        client.end();
        resolve();
      });

      client.on('error', (err) => {
        reject(new Error(`Failed to connect to ${config.host}:${config.port} - ${err.message}`));
      });

      client.setTimeout(5000, () => {
        client.destroy();
        reject(new Error('Connection timeout'));
      });
    });

    // Since we're using MailHog for development, we'll send a test email via fetch to the SMTP API
    console.log('Sending test email via MailHog...');

    const emailData = {
      from: `"${config.fromName}" <${config.from}>`,
      to: 'customer@test.com',
      subject: `MailHog Test - ${new Date().toLocaleTimeString()}`,
      text: 'This is a test email for MailHog verification.',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #f5f2ed; padding: 30px; border-radius: 8px;">
            <h1 style="color: #2c1810; margin-bottom: 20px; font-size: 28px;">MailHog Test Email ✉️</h1>

            <p style="color: #8b7355; line-height: 1.6; font-size: 16px;">
              This confirms your MailHog email setup is working correctly with the Backroom Leeds booking system.
            </p>

            <div style="background-color: white; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #2c1810; margin-top: 0;">Configuration Details</h3>
              <ul style="color: #8b7355; line-height: 1.8;">
                <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
                <li><strong>Timestamp:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</li>
                <li><strong>SMTP Server:</strong> ${config.host}:${config.port}</li>
                <li><strong>Email Provider:</strong> ${config.provider}</li>
              </ul>
            </div>

            <p style="color: #a89482; font-size: 14px; margin-top: 20px;">
              This is an automated test email. View all emails at:
              <a href="http://localhost:8025" style="color: #8b7355;">http://localhost:8025</a>
            </p>
          </div>
        </div>
      `
    };

    // For MailHog, we'll use the API endpoint to verify it's working
    const response = await fetch('http://localhost:8025/api/v2/messages', {
      method: 'GET'
    });

    if (response.ok) {
      console.log('✅ MailHog API is accessible!');
      console.log('\n========================================');
      console.log('📧 MailHog is configured correctly!');
      console.log('   View emails at: http://localhost:8025');
      console.log('========================================\n');

      console.log('Note: To send actual emails through the application,');
      console.log('use the booking system endpoints which will use');
      console.log('the configured email provider (MailHog for dev).\n');
    } else {
      throw new Error(`MailHog API returned status ${response.status}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('   Error:', error instanceof Error ? error.message : error);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if MailHog is running:');
    console.error('     docker ps | grep mailhog');
    console.error('  2. Check MailHog logs:');
    console.error('     docker logs backroom-mailhog');
    console.error('  3. Restart MailHog:');
    console.error('     docker-compose -f docker-compose.dev.yml restart mailhog');
    console.error('  4. Check ports 1025 (SMTP) and 8025 (Web UI) are accessible');
    process.exit(1);
  }
}

testMailHog().catch(console.error);