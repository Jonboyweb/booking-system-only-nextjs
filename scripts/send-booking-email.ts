import * as dotenv from 'dotenv';
import { PrismaClient } from '../lib/generated/prisma';

dotenv.config();

const prisma = new PrismaClient();

// Import the email function with dynamic import to handle module differences
async function sendTestBookingEmail() {
  try {
    // Get the most recent booking
    const booking = await prisma.booking.findFirst({
      orderBy: { createdAt: 'desc' },
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
        }
      }
    });

    if (!booking) {
      console.log('No bookings found in the database');
      process.exit(1);
    }

    console.log('Found booking:', booking.bookingReference);
    console.log('Customer email:', booking.customer.email);
    console.log('Sending confirmation email...\n');

    // Dynamically import the email function
    const { sendBookingConfirmationEmail } = await import('../src/lib/email/sendgrid');

    // Format booking data for email
    const emailBooking = {
      ...booking,
      email: booking.customer.email,
      name: `${booking.customer.firstName} ${booking.customer.lastName}`,
      phone: booking.customer.phone,
      reference_number: booking.bookingReference,
      table_name: `Table ${booking.table.tableNumber} - ${booking.table.floor}`,
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
    };

    const success = await sendBookingConfirmationEmail(emailBooking);

    if (success) {
      console.log('✅ Confirmation email sent successfully!');
      console.log('Check MailHog at: http://localhost:8025');
    } else {
      console.log('❌ Failed to send confirmation email');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendTestBookingEmail();