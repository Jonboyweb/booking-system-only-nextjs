import { db } from '../lib/db';


async function checkBooking() {
  try {
    const booking = await db.booking.findUnique({
      where: { bookingReference: 'BR-WDLD1I' },
      include: {
        customer: true,
        paymentLogs: true
      }
    });

    if (booking) {
      console.log('Booking found:');
      console.log('-------------------');
      console.log('Full booking object:', JSON.stringify(booking, null, 2));
      console.log('\n\nParsed Details:');
      console.log('-------------------');
      console.log('Reference:', booking.bookingReference);
      console.log('Status:', booking.status);
      console.log('Date:', booking.bookingDate);
      console.log('Time:', booking.bookingTime);
      // Commented out fields that may not exist in all bookings
      console.log('Customer:', `${booking.customer?.firstName} ${booking.customer?.lastName}`, '(', booking.customer?.email, ')');
      // console.log('Total Amount:', booking.totalAmount);
      // console.log('Deposit Amount:', booking.depositAmount);
      // console.log('Deposit Paid:', booking.depositPaid);
      // console.log('Stripe Payment Intent:', booking.stripeIntentId);
      console.log('\nPayment Logs:');
      console.log('-------------------');
      if (booking.paymentLogs && booking.paymentLogs.length > 0) {
        booking.paymentLogs.forEach((log: any) => {
          console.log(`- ${log.status} at ${log.createdAt}`);
          if (log.metadata) {
            console.log('  Metadata:', JSON.stringify(log.metadata));
          }
        });
      } else {
        console.log('No payment logs found');
      }
      // console.log('\nEmail Status:');
      // console.log('-------------------');
      // console.log('Confirmation Email Sent:', booking.confirmationSent);
      // console.log('Email Sent At:', booking.confirmationSentAt);
    } else {
      console.log('Booking not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkBooking();