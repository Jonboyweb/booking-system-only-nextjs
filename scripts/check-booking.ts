import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkBooking() {
  try {
    const booking = await prisma.booking.findUnique({
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
      console.log('Customer:', booking.customer?.name, '(', booking.customer?.email, ')');
      console.log('Total Amount:', booking.totalPrice);
      console.log('Payment Status:', booking.paymentStatus);
      console.log('Stripe Payment Intent:', booking.stripePaymentIntentId);
      console.log('\nPayment Logs:');
      console.log('-------------------');
      if (booking.paymentLogs && booking.paymentLogs.length > 0) {
        booking.paymentLogs.forEach(log => {
          console.log(`- ${log.status} at ${log.createdAt} (${log.provider})`);
          if (log.metadata) {
            console.log('  Metadata:', JSON.stringify(log.metadata));
          }
        });
      } else {
        console.log('No payment logs found');
      }
      console.log('\nEmail Status:');
      console.log('-------------------');
      console.log('Confirmation Email Sent:', booking.emailSent);
      console.log('Email Sent At:', booking.emailSentAt);
    } else {
      console.log('Booking not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBooking();