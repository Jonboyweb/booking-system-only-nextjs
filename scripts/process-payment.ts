import { PrismaClient } from '../lib/generated/prisma';
import { sendBookingConfirmationEmail } from '../src/lib/email/sendgrid';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function processPayment(bookingReference: string) {
  try {
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { bookingReference },
      include: {
        customer: true,
        table: true,
        drinkPackage: true,
        spirits: {
          include: {
            spirit: true
          }
        },
        champagnes: {
          include: {
            champagne: true
          }
        },
      }
    });

    if (!booking) {
      console.log('Booking not found');
      return;
    }

    console.log('Processing payment for booking:', booking.bookingReference);
    console.log('Current status:', booking.status);
    console.log('Deposit paid:', booking.depositPaid);

    // Update booking status to confirmed
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        depositPaid: true,
        stripePaymentId: booking.stripeIntentId,
        status: 'CONFIRMED',
        paymentDate: new Date(),
      }
    });

    console.log('Booking updated to CONFIRMED status');

    // Format booking data for email
    const emailBooking = {
      ...booking,
      email: booking.customer.email,
      name: `${booking.customer.firstName} ${booking.customer.lastName}`,
      phone: booking.customer.phone,
      reference_number: booking.bookingReference,
      table_name: `Table ${booking.table.tableNumber} - ${booking.table.floor.charAt(0).toUpperCase() + booking.table.floor.slice(1).toLowerCase()}`,
      date: booking.bookingDate.toISOString().split('T')[0],
      time: booking.bookingTime,
      booking_time: booking.bookingTime,
      party_size: booking.partySize,
      drinks_package: booking.drinkPackage?.name,
      custom_spirits: booking.spirits.length > 0 
        ? booking.spirits.map(bs => `${bs.spirit.name} (£${bs.spirit.price})`).join('\n')
        : undefined,
      custom_champagnes: booking.champagnes.length > 0
        ? booking.champagnes.map(bc => `${bc.champagne.name} (£${bc.champagne.price})`).join('\n')
        : undefined,
      stripe_payment_intent_id: booking.stripeIntentId
    };

    // Send confirmation email
    try {
      await sendBookingConfirmationEmail(emailBooking);
      console.log('✅ Confirmation email sent successfully to:', booking.customer.email);
    } catch (error) {
      console.error('❌ Failed to send confirmation email:', error);
    }

    // Log the successful payment
    await prisma.paymentLog.create({
      data: {
        bookingId: booking.id,
        stripePaymentId: booking.stripeIntentId!,
        amount: 5000, // £50 in pence
        currency: 'gbp',
        status: 'SUCCEEDED',
        metadata: {
          bookingReference: booking.bookingReference,
          processedManually: 'true',
          processedAt: new Date().toISOString()
        },
      }
    });

    console.log('✅ Payment log created');
    console.log('\n=================================');
    console.log('Payment processing complete!');
    console.log('Booking:', booking.bookingReference);
    console.log('Status: CONFIRMED');
    console.log('Customer:', booking.customer.email);
    console.log('=================================');
    
  } catch (error) {
    console.error('Error processing payment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Process the specific booking
processPayment('BR-WDLD1I');