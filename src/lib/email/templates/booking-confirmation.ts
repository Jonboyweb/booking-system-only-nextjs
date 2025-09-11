interface EmailBooking {
  date?: string;
  reference_number?: string;
  bookingReference?: string;
  customer_name?: string;
  email?: string;
  table_name?: string;
  booking_date?: string;
  booking_time?: string;
  party_size?: number;
  partySize?: number;
  special_requests?: string;
  specialRequests?: string;
  deposit_amount?: number;
  depositAmount?: number;
  drink_package?: string;
  custom_spirits?: string;
  custom_champagnes?: string;
  custom_order_total?: number;
  stripe_payment_intent_id?: string;
  stripeIntentId?: string;
  [key: string]: unknown;
}

export function generateBookingConfirmationEmail(booking: EmailBooking): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Booking Confirmation - The Backroom Leeds - ${booking.date}`;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const drinksInfo = booking.drinks_package 
    ? `<p><strong>Drinks Package:</strong> ${booking.drinks_package}</p>`
    : booking.custom_spirits || booking.custom_champagnes
      ? `
        ${booking.custom_spirits ? `<p><strong>Spirits Selected:</strong><br/>${booking.custom_spirits.replace(/\n/g, '<br/>')}</p>` : ''}
        ${booking.custom_champagnes ? `<p><strong>Champagnes Selected:</strong><br/>${booking.custom_champagnes.replace(/\n/g, '<br/>')}</p>` : ''}
      `
      : '';

  const text = `
Booking Confirmation - The Backroom Leeds

Dear ${booking.name},

Thank you for your booking at The Backroom Leeds. Your reservation has been confirmed.

BOOKING DETAILS
---------------
Reference Number: ${booking.reference_number}
Date: ${formatDate(booking.date || booking.booking_date || '')}
Time: ${formatTime(booking.booking_time || '')}
Party Size: ${booking.party_size} guests
Table: ${booking.table_name}

${booking.drinks_package ? `Drinks Package: ${booking.drinks_package}` : ''}
${booking.custom_spirits ? `Spirits Selected:\n${booking.custom_spirits}` : ''}
${booking.custom_champagnes ? `Champagnes Selected:\n${booking.custom_champagnes}` : ''}

PAYMENT DETAILS
--------------
Deposit Paid: £50.00
Payment Reference: ${booking.stripe_payment_intent_id}

VENUE DETAILS
------------
The Backroom Leeds
[Venue Address]
Leeds, UK

IMPORTANT INFORMATION
--------------------
- Please arrive on time for your reservation
- Your table will be held for 15 minutes after your booking time
- The remaining balance for any drinks packages or bottle service will be settled at the venue
- Dress code: Smart casual (no sportswear)
- Valid ID required for entry

NEED TO MAKE CHANGES?
--------------------
If you need to modify or cancel your booking, please contact us at:
Email: bookings@thebackroomleeds.com
Phone: [Phone Number]

We look forward to welcoming you to The Backroom Leeds!

Best regards,
The Backroom Leeds Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - The Backroom Leeds</title>
  <style>
    body {
      font-family: Georgia, serif;
      line-height: 1.6;
      color: #2c1810;
      background-color: #f5f2ed;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #2c1810 0%, #8b7355 100%);
      color: #d4af37;
      padding: 30px;
      text-align: center;
      border-bottom: 3px solid #d4af37;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: normal;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #2c1810;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: #faf9f6;
      border-left: 3px solid #d4af37;
    }
    .section-title {
      font-size: 16px;
      color: #8b7355;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      font-weight: bold;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0d5c7;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: bold;
      color: #8b7355;
    }
    .detail-value {
      color: #2c1810;
    }
    .reference-number {
      background-color: #2c1810;
      color: #d4af37;
      padding: 15px;
      text-align: center;
      font-size: 18px;
      letter-spacing: 2px;
      margin: 20px 0;
    }
    .info-box {
      background-color: #f5f2ed;
      border: 1px solid #d4af37;
      padding: 20px;
      margin: 20px 0;
    }
    .info-box ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .info-box li {
      margin-bottom: 8px;
    }
    .footer {
      background-color: #2c1810;
      color: #d4af37;
      padding: 30px;
      text-align: center;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background-color: #d4af37;
      color: #2c1810;
      padding: 12px 30px;
      text-decoration: none;
      margin-top: 20px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>The Backroom Leeds</h1>
      <p>Exclusive Prohibition-Era Nightclub Experience</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear ${booking.name},
      </div>
      
      <p>Thank you for your booking at The Backroom Leeds. We're delighted to confirm your reservation for an unforgettable evening at our exclusive prohibition-themed venue.</p>
      
      <div class="reference-number">
        BOOKING REFERENCE: ${booking.reference_number}
      </div>
      
      <div class="section">
        <div class="section-title">Reservation Details</div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formatDate(booking.date || booking.booking_date || '')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${formatTime(booking.booking_time || '')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Party Size:</span>
          <span class="detail-value">${booking.party_size} guests</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Table:</span>
          <span class="detail-value">${booking.table_name}</span>
        </div>
      </div>
      
      ${drinksInfo ? `
      <div class="section">
        <div class="section-title">Drinks Selection</div>
        ${drinksInfo}
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="detail-row">
          <span class="detail-label">Deposit Paid:</span>
          <span class="detail-value">£50.00</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Reference:</span>
          <span class="detail-value" style="font-size: 12px;">${booking.stripe_payment_intent_id}</span>
        </div>
      </div>
      
      <div class="info-box">
        <div class="section-title">Important Information</div>
        <ul>
          <li>Please arrive on time for your reservation</li>
          <li>Your table will be held for 15 minutes after your booking time</li>
          <li>The remaining balance for any drinks packages or bottle service will be settled at the venue</li>
          <li>Dress code: Smart casual (no sportswear)</li>
          <li>Valid ID required for entry (21+ only)</li>
        </ul>
      </div>
      
      <div class="section">
        <div class="section-title">Venue Location</div>
        <p>
          The Backroom Leeds<br>
          [Venue Address]<br>
          Leeds, UK
        </p>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        We look forward to welcoming you to The Backroom Leeds for an exceptional evening of cocktails, entertainment, and the finest prohibition-era atmosphere.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Need to make changes?</strong></p>
      <p>Email: bookings@thebackroomleeds.com</p>
      <p>Phone: [Phone Number]</p>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
        This email confirms your booking at The Backroom Leeds. Please retain this confirmation for your records.
      </p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, text, html };
}