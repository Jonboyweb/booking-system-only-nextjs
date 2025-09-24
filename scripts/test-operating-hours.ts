#!/usr/bin/env tsx

/**
 * Test script to verify operating hours and booking time slots
 */

import { generateTimeSlots, getOperatingHours, isValidBookingTimeSlot, isTimeWithinOperatingHours } from '../lib/operating-hours';

function formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  const h = parseInt(hour);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${minute} ${period}`;
}

function testRegularDay() {
  console.log('\n📅 Testing Regular Day (January 15, 2025)');
  console.log('=' .repeat(50));

  const regularDate = new Date('2025-01-15');
  const hours = getOperatingHours(regularDate);
  const slots = generateTimeSlots(regularDate);

  console.log('\n🏢 Venue Operating Hours:');
  console.log(`   Opens: ${hours.startTime} (${formatTime(hours.startTime)})`);
  console.log(`   Closes: ${hours.endTime} (${formatTime(hours.endTime)})`);
  console.log(`   Last Booking: ${hours.lastBookingTime} (${formatTime(hours.lastBookingTime)})`);
  console.log(`   Special Event: ${hours.isSpecialEvent ? hours.eventName : 'No'}`);

  console.log('\n⏰ Available Booking Slots:');
  slots.forEach((slot, index) => {
    if (index % 4 === 0 && index > 0) console.log();
    process.stdout.write(`   ${slot} (${formatTime(slot)})`.padEnd(22));
  });
  console.log('\n');

  console.log('\n✅ Validation Tests:');
  const testTimes = ['22:00', '23:00', '23:30', '00:00', '01:00', '02:00', '02:30', '03:00', '04:00'];
  testTimes.forEach(time => {
    const isValid = isValidBookingTimeSlot(regularDate, time);
    const inHours = isTimeWithinOperatingHours(regularDate, time);
    console.log(`   ${time} (${formatTime(time)}): Valid Slot: ${isValid ? '✅' : '❌'}, Within Booking Hours: ${inHours ? '✅' : '❌'}`);
  });

  // Verify expected behavior
  const expectedSlots = ['23:00', '23:30', '00:00', '00:30', '01:00', '01:30', '02:00'];
  const allCorrect = expectedSlots.every(slot => slots.includes(slot));
  const noExtra = slots.every(slot => expectedSlots.includes(slot));

  if (allCorrect && noExtra) {
    console.log('\n✅ Regular day booking slots are correct!');
  } else {
    console.log('\n❌ Regular day booking slots are incorrect!');
    console.log('Expected:', expectedSlots);
    console.log('Got:', slots);
  }
}

function testNewYearsEve() {
  console.log('\n🎉 Testing New Year\'s Eve (December 31, 2025)');
  console.log('=' .repeat(50));

  const nyeDate = new Date('2025-12-31');
  const hours = getOperatingHours(nyeDate);
  const slots = generateTimeSlots(nyeDate);

  console.log('\n🏢 Venue Operating Hours:');
  console.log(`   Opens: ${hours.startTime} (${formatTime(hours.startTime)})`);
  console.log(`   Closes: ${hours.endTime} (${formatTime(hours.endTime)})`);
  console.log(`   Last Booking: ${hours.lastBookingTime} (${formatTime(hours.lastBookingTime)})`);
  console.log(`   Special Event: ${hours.isSpecialEvent ? hours.eventName : 'No'}`);

  console.log('\n⏰ Available Booking Slots:');
  slots.forEach((slot, index) => {
    if (index % 4 === 0 && index > 0) console.log();
    process.stdout.write(`   ${slot} (${formatTime(slot)})`.padEnd(22));
  });
  console.log('\n');

  console.log('\n✅ Validation Tests:');
  const testTimes = ['20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '03:30', '04:00'];
  testTimes.forEach(time => {
    const isValid = isValidBookingTimeSlot(nyeDate, time);
    const inHours = isTimeWithinOperatingHours(nyeDate, time);
    console.log(`   ${time} (${formatTime(time)}): Valid Slot: ${isValid ? '✅' : '❌'}, Within Booking Hours: ${inHours ? '✅' : '❌'}`);
  });

  // Verify NYE has extended hours
  const hasEarlySlots = slots.includes('21:00') && slots.includes('21:30') && slots.includes('22:00');
  const hasLateSlots = slots.includes('02:30') && slots.includes('03:00');

  if (hasEarlySlots && hasLateSlots) {
    console.log('\n✅ New Year\'s Eve extended booking slots are correct!');
  } else {
    console.log('\n❌ New Year\'s Eve booking slots are incorrect!');
    if (!hasEarlySlots) console.log('   Missing early slots (21:00 - 22:30)');
    if (!hasLateSlots) console.log('   Missing late slots (02:30 - 03:00)');
  }
}

function testChristmasEve() {
  console.log('\n🎄 Testing Christmas Eve (December 24, 2025)');
  console.log('=' .repeat(50));

  const xmasEveDate = new Date('2025-12-24');
  const hours = getOperatingHours(xmasEveDate);
  const slots = generateTimeSlots(xmasEveDate);

  console.log('\n🏢 Venue Operating Hours:');
  console.log(`   Opens: ${hours.startTime} (${formatTime(hours.startTime)})`);
  console.log(`   Closes: ${hours.endTime} (${formatTime(hours.endTime)})`);
  console.log(`   Last Booking: ${hours.lastBookingTime} (${formatTime(hours.lastBookingTime)})`);
  console.log(`   Special Event: ${hours.isSpecialEvent ? hours.eventName : 'No'}`);

  console.log('\n⏰ Available Booking Slots:');
  slots.forEach((slot, index) => {
    if (index % 4 === 0 && index > 0) console.log();
    process.stdout.write(`   ${slot} (${formatTime(slot)})`.padEnd(22));
  });
  console.log('\n');

  // Verify Christmas Eve has early start but standard last booking
  const hasEarlySlots = slots.includes('22:00') && slots.includes('22:30');
  const noLateSlots = !slots.includes('02:30') && !slots.includes('03:00');

  if (hasEarlySlots && noLateSlots) {
    console.log('\n✅ Christmas Eve booking slots are correct!');
  } else {
    console.log('\n❌ Christmas Eve booking slots are incorrect!');
    if (!hasEarlySlots) console.log('   Missing early slots (22:00 - 22:30)');
    if (!noLateSlots) console.log('   Should not have slots after 02:00');
  }
}

function testChristmasDay() {
  console.log('\n🎅 Testing Christmas Day (December 25, 2025)');
  console.log('=' .repeat(50));

  const xmasDate = new Date('2025-12-25');
  const hours = getOperatingHours(xmasDate);
  const slots = generateTimeSlots(xmasDate);

  console.log('\n🏢 Venue Operating Hours:');
  console.log(`   Opens: ${hours.startTime} (${formatTime(hours.startTime)})`);
  console.log(`   Closes: ${hours.endTime} (${formatTime(hours.endTime)})`);
  console.log(`   Last Booking: ${hours.lastBookingTime} (${formatTime(hours.lastBookingTime)})`);
  console.log(`   Special Event: ${hours.isSpecialEvent ? hours.eventName : 'No'}`);

  console.log('\n⏰ Available Booking Slots:');
  slots.forEach((slot, index) => {
    if (index % 4 === 0 && index > 0) console.log();
    process.stdout.write(`   ${slot} (${formatTime(slot)})`.padEnd(22));
  });
  console.log('\n');

  // Verify Christmas has early start AND extended last booking
  const hasEarlySlots = slots.includes('22:00') && slots.includes('22:30');
  const hasLateSlots = slots.includes('02:30') && slots.includes('03:00');

  if (hasEarlySlots && hasLateSlots) {
    console.log('\n✅ Christmas Day extended booking slots are correct!');
  } else {
    console.log('\n❌ Christmas Day booking slots are incorrect!');
    if (!hasEarlySlots) console.log('   Missing early slots (22:00 - 22:30)');
    if (!hasLateSlots) console.log('   Missing late slots (02:30 - 03:00)');
  }
}

function main() {
  console.log('\n🏢 TESTING VENUE OPERATING HOURS AND BOOKING SLOTS');
  console.log('=' .repeat(50));
  console.log('This script verifies that:');
  console.log('1. Venue operates from 11pm (23:00) to 6am (06:00)');
  console.log('2. Regular booking slots are from 11pm to 2am');
  console.log('3. Special events have extended booking windows');

  testRegularDay();
  testNewYearsEve();
  testChristmasEve();
  testChristmasDay();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ All operating hours tests completed!');
  console.log('=' .repeat(50) + '\n');
}

main();