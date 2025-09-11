interface RefundData {
  booking: any;
  refundAmount: number;
  refundId: string;
  reason: string;
  refundDate: Date;
}

export function generateRefundConfirmationEmail(data: RefundData): {
  subject: string;
  text: string;
  html: string;
} {
  const { booking, refundAmount, refundId, reason, refundDate } = data;
  
  const subject = `Refund Confirmation - The Backroom Leeds - ${booking.reference_number}`;
  
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
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

  const text = `
Refund Confirmation - The Backroom Leeds

Dear ${booking.name},

We have successfully processed your refund for your booking at The Backroom Leeds.

REFUND DETAILS
--------------
Refund Amount: £${refundAmount.toFixed(2)}
Refund Reference: ${refundId}
Refund Date: ${formatDate(refundDate)}
Reason: ${reason}

ORIGINAL BOOKING DETAILS
------------------------
Reference Number: ${booking.reference_number}
Date: ${formatDate(booking.date)}
Time: ${formatTime(booking.time)}
Party Size: ${booking.party_size} guests
Table: ${booking.table_name}

IMPORTANT INFORMATION
--------------------
- The refund will appear in your account within 5-10 business days
- The refund will be credited to the same payment method used for the original booking
- Your booking has been cancelled as a result of this refund

If you have any questions about this refund, please contact us:
Email: bookings@thebackroomleeds.com
Phone: [Phone Number]

We hope to welcome you to The Backroom Leeds in the future.

Best regards,
The Backroom Leeds Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Confirmation - The Backroom Leeds</title>
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
    .refund-box {
      background-color: #e8f5e9;
      border: 2px solid #4caf50;
      border-radius: 5px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .refund-amount {
      font-size: 36px;
      color: #2e7d32;
      font-weight: bold;
      margin: 10px 0;
    }
    .refund-status {
      font-size: 18px;
      color: #2e7d32;
      margin: 10px 0;
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
    .cancelled-badge {
      display: inline-block;
      background-color: #ff5252;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>The Backroom Leeds</h1>
      <p>Refund Confirmation</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear ${booking.name},
      </div>
      
      <p>We have successfully processed your refund for your booking at The Backroom Leeds.</p>
      
      <div class="refund-box">
        <div class="refund-status">✓ REFUND PROCESSED</div>
        <div class="refund-amount">£${refundAmount.toFixed(2)}</div>
        <p style="margin: 10px 0; color: #666; font-size: 14px;">
          Reference: ${refundId}
        </p>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Processed on ${formatDate(refundDate)}
        </p>
      </div>
      
      <div class="section">
        <div class="section-title">Refund Details</div>
        <div class="detail-row">
          <span class="detail-label">Amount Refunded:</span>
          <span class="detail-value">£${refundAmount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Refund Reference:</span>
          <span class="detail-value" style="font-size: 12px;">${refundId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Processing Date:</span>
          <span class="detail-value">${formatDate(refundDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reason:</span>
          <span class="detail-value">${reason}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Original Booking Details</div>
        <div class="detail-row">
          <span class="detail-label">Booking Reference:</span>
          <span class="detail-value">${booking.reference_number}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formatDate(booking.date)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${formatTime(booking.time)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Party Size:</span>
          <span class="detail-value">${booking.party_size} guests</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Table:</span>
          <span class="detail-value">${booking.table_name}</span>
        </div>
        <div style="text-align: center; margin-top: 15px;">
          <span class="cancelled-badge">BOOKING CANCELLED</span>
        </div>
      </div>
      
      <div class="info-box">
        <div class="section-title">Important Information</div>
        <ul>
          <li>The refund will appear in your account within 5-10 business days</li>
          <li>The refund will be credited to the same payment method used for the original booking</li>
          <li>Your booking has been cancelled as a result of this refund</li>
          <li>If you wish to make a new booking, please visit our website</li>
        </ul>
      </div>
      
      <p style="text-align: center; margin-top: 30px; font-style: italic;">
        We're sorry to see you won't be joining us this time. We hope to welcome you to The Backroom Leeds in the future.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Questions about this refund?</strong></p>
      <p>Email: bookings@thebackroomleeds.com</p>
      <p>Phone: [Phone Number]</p>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
        This email confirms the refund for your booking at The Backroom Leeds. Please retain this confirmation for your records.
      </p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, text, html };
}