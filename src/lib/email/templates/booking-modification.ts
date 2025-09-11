interface BookingData {
  reference_number?: string;
  customer_name?: string;
  email?: string;
  table_name?: string;
  booking_date?: string;
  booking_time?: string;
  party_size?: number;
  special_requests?: string;
  deposit_amount?: number;
  drink_package?: string;
  custom_spirits?: string;
  custom_champagnes?: string;
  custom_order_total?: number;
  [key: string]: unknown;
}

interface ModificationData {
  originalBooking: BookingData;
  updatedBooking: BookingData;
  modificationReason?: string;
  modifiedBy?: string;
}

export function generateBookingModificationEmail(data: ModificationData): {
  subject: string;
  text: string;
  html: string;
} {
  const { originalBooking, updatedBooking, modificationReason } = data;
  
  const subject = `Booking Update - The Backroom Leeds - Reference: ${updatedBooking.reference_number}`;
  
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

  // Identify what changed
  const changes: string[] = [];
  let changesSummaryHtml = '';
  let changesSummaryText = '';

  if (originalBooking.date !== updatedBooking.date) {
    changes.push('Date');
    changesSummaryHtml += `<li><strong>Date:</strong> ${formatDate(originalBooking.date)} → ${formatDate(updatedBooking.date)}</li>`;
    changesSummaryText += `- Date: ${formatDate(originalBooking.date)} → ${formatDate(updatedBooking.date)}\n`;
  }

  if (originalBooking.time !== updatedBooking.time) {
    changes.push('Time');
    changesSummaryHtml += `<li><strong>Time:</strong> ${formatTime(originalBooking.time)} → ${formatTime(updatedBooking.time)}</li>`;
    changesSummaryText += `- Time: ${formatTime(originalBooking.time)} → ${formatTime(updatedBooking.time)}\n`;
  }

  if (originalBooking.party_size !== updatedBooking.party_size) {
    changes.push('Party Size');
    changesSummaryHtml += `<li><strong>Party Size:</strong> ${originalBooking.party_size} → ${updatedBooking.party_size} guests</li>`;
    changesSummaryText += `- Party Size: ${originalBooking.party_size} → ${updatedBooking.party_size} guests\n`;
  }

  if (originalBooking.table_name !== updatedBooking.table_name) {
    changes.push('Table');
    changesSummaryHtml += `<li><strong>Table:</strong> ${originalBooking.table_name} → ${updatedBooking.table_name}</li>`;
    changesSummaryText += `- Table: ${originalBooking.table_name} → ${updatedBooking.table_name}\n`;
  }

  const changesListHtml = changesSummaryHtml ? `<ul style="margin: 15px 0; padding-left: 20px;">${changesSummaryHtml}</ul>` : '';

  const text = `
Booking Update - The Backroom Leeds

Dear ${updatedBooking.name},

Your booking at The Backroom Leeds has been updated. Please review the changes below.

WHAT HAS CHANGED
----------------
${changesSummaryText}
${modificationReason ? `\nReason for change: ${modificationReason}\n` : ''}

YOUR UPDATED BOOKING DETAILS
----------------------------
Reference Number: ${updatedBooking.reference_number}
Date: ${formatDate(updatedBooking.date)}
Time: ${formatTime(updatedBooking.time)}
Party Size: ${updatedBooking.party_size} guests
Table: ${updatedBooking.table_name}

${updatedBooking.drinks_package ? `Drinks Package: ${updatedBooking.drinks_package}` : ''}
${updatedBooking.custom_spirits ? `Spirits Selected:\n${updatedBooking.custom_spirits}` : ''}
${updatedBooking.custom_champagnes ? `Champagnes Selected:\n${updatedBooking.custom_champagnes}` : ''}

PAYMENT DETAILS
--------------
Your original deposit of £50.00 remains valid for this updated booking.
Payment Reference: ${updatedBooking.stripe_payment_intent_id}

VENUE DETAILS
------------
The Backroom Leeds
[Venue Address]
Leeds, UK

IMPORTANT INFORMATION
--------------------
- Please arrive on time for your updated reservation
- Your table will be held for 15 minutes after your booking time
- The remaining balance for any drinks packages or bottle service will be settled at the venue
- Dress code: Smart casual (no sportswear)
- Valid ID required for entry

NEED FURTHER ASSISTANCE?
------------------------
If you have any questions about these changes or need further modifications, please contact us:
Email: bookings@thebackroomleeds.com
Phone: [Phone Number]

We apologize for any inconvenience and look forward to welcoming you to The Backroom Leeds!

Best regards,
The Backroom Leeds Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Update - The Backroom Leeds</title>
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
    .alert-box {
      background-color: #fff3cd;
      border: 2px solid #d4af37;
      border-radius: 5px;
      padding: 20px;
      margin: 20px 0;
    }
    .alert-box h2 {
      color: #856404;
      margin-top: 0;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 1px;
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
    .change-highlight {
      background-color: #fff3cd;
      padding: 2px 5px;
      border-radius: 3px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>The Backroom Leeds</h1>
      <p>Booking Update Notification</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear ${updatedBooking.name},
      </div>
      
      <p>Your booking at The Backroom Leeds has been updated. Please review the important changes below.</p>
      
      <div class="alert-box">
        <h2>⚠️ Important Changes to Your Booking</h2>
        <p><strong>The following details have been modified:</strong></p>
        ${changesListHtml}
        ${modificationReason ? `<p style="margin-top: 15px;"><strong>Reason for change:</strong> ${modificationReason}</p>` : ''}
      </div>
      
      <div class="reference-number">
        BOOKING REFERENCE: ${updatedBooking.reference_number}
      </div>
      
      <div class="section">
        <div class="section-title">Your Updated Reservation Details</div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value ${originalBooking.date !== updatedBooking.date ? 'change-highlight' : ''}">${formatDate(updatedBooking.date)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value ${originalBooking.time !== updatedBooking.time ? 'change-highlight' : ''}">${formatTime(updatedBooking.time)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Party Size:</span>
          <span class="detail-value ${originalBooking.party_size !== updatedBooking.party_size ? 'change-highlight' : ''}">${updatedBooking.party_size} guests</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Table:</span>
          <span class="detail-value ${originalBooking.table_name !== updatedBooking.table_name ? 'change-highlight' : ''}">${updatedBooking.table_name}</span>
        </div>
      </div>
      
      ${updatedBooking.drinks_package || updatedBooking.custom_spirits || updatedBooking.custom_champagnes ? `
      <div class="section">
        <div class="section-title">Drinks Selection</div>
        ${updatedBooking.drinks_package ? `<p><strong>Package:</strong> ${updatedBooking.drinks_package}</p>` : ''}
        ${updatedBooking.custom_spirits ? `<p><strong>Spirits Selected:</strong><br/>${updatedBooking.custom_spirits.replace(/\n/g, '<br/>')}</p>` : ''}
        ${updatedBooking.custom_champagnes ? `<p><strong>Champagnes Selected:</strong><br/>${updatedBooking.custom_champagnes.replace(/\n/g, '<br/>')}</p>` : ''}
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">Payment Information</div>
        <p>Your original deposit of <strong>£50.00</strong> remains valid for this updated booking.</p>
        <p style="font-size: 12px; color: #666;">Payment Reference: ${updatedBooking.stripe_payment_intent_id}</p>
      </div>
      
      <div class="info-box">
        <div class="section-title">Important Reminders</div>
        <ul>
          <li>Please arrive on time for your updated reservation</li>
          <li>Your table will be held for 15 minutes after your booking time</li>
          <li>The remaining balance for any drinks packages will be settled at the venue</li>
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
      
      <p style="text-align: center; margin-top: 30px; font-style: italic;">
        We apologize for any inconvenience these changes may cause and look forward to welcoming you to The Backroom Leeds on your updated reservation date.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Questions about these changes?</strong></p>
      <p>Email: bookings@thebackroomleeds.com</p>
      <p>Phone: [Phone Number]</p>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
        This email confirms the updates to your booking at The Backroom Leeds. Please retain this notification for your records.
      </p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, text, html };
}