# Booking Modification Feature - Implementation Plan

## Overview
This document outlines the plan to add booking modification capabilities to the admin dashboard, allowing administrators to edit existing bookings with proper validation and customer notifications.

## Features to Implement
- Edit booking date, time, party size, and table number
- Real-time table availability validation
- Prevent double-booking conflicts
- Send confirmation emails about changes to customers
- Track modification history for audit purposes

## Implementation Steps

### 1. Add Edit Mode to Booking Detail Page
**File**: `/app/admin/dashboard/bookings/[id]/page.tsx`

**Changes**:
- Add "Edit Booking" button to toggle edit mode
- Create form fields for editable attributes:
  - Date picker (max 31 days in advance)
  - Time selector (10pm-3am slots)
  - Party size input (2-12 guests)
  - Table selector with availability indicators
- Show current values as defaults
- Add "Save Changes" and "Cancel" buttons
- Include "Send notification email" checkbox

### 2. Create Availability Validation Helper
**New File**: `/src/lib/booking/availability.ts`

**Functions to implement**:
```typescript
// Check if a specific table is available
checkTableAvailability(
  tableId: string, 
  date: string, 
  time: string, 
  excludeBookingId?: string
): Promise<boolean>

// Validate party size against table capacity
validatePartySize(
  tableId: string, 
  partySize: number
): Promise<boolean>

// Get all available tables for a date/time
getAvailableTablesForDateTime(
  date: string, 
  time: string, 
  partySize: number
): Promise<Table[]>

// Check if tables 15 & 16 can be combined
canCombineTables(
  partySize: number, 
  date: string, 
  time: string
): Promise<boolean>
```

### 3. Enhance API Route for Booking Updates
**File**: `/app/api/admin/bookings/[id]/route.ts`

**PATCH endpoint enhancements**:
```typescript
interface UpdateBookingRequest {
  bookingDate?: string;
  bookingTime?: string;
  partySize?: number;
  tableId?: string;
  previousTableId?: string;
  modificationReason?: string;
  sendEmail?: boolean;
}
```

**Validation logic**:
- Check table availability for new date/time
- Validate party size against table capacity
- Prevent double-booking
- Store modification history
- Trigger email if requested

### 4. Create Booking Modification Email Template
**New File**: `/src/lib/email/templates/booking-modification.ts`

**Email content**:
- Subject: "Booking Update - The Backroom Leeds"
- Show original booking details
- Highlight changed fields
- Display new booking details
- Include modification reason if provided
- Professional prohibition-themed design

### 5. Create Send Modification Email Endpoint
**New File**: `/app/api/admin/bookings/[id]/send-modification-email/route.ts`

**Features**:
- Send email with old and new booking details
- Include admin's modification reason
- Log email send status
- Return success/failure response

### 6. Add Real-time Availability Checking Endpoint
**New File**: `/app/api/admin/bookings/[id]/check-availability/route.ts`

**Request/Response**:
```typescript
// Request
{
  bookingId: string;
  date: string;
  time: string;
  tableId: string;
  partySize: number;
}

// Response
{
  available: boolean;
  conflicts?: string[];
  alternativeTables?: Table[];
  capacityValid: boolean;
}
```

### 7. Update Prisma Schema for Modification Tracking
**File**: `/prisma/schema.prisma`

**New model**:
```prisma
model BookingModification {
  id           String   @id @default(uuid())
  bookingId    String
  booking      Booking  @relation(fields: [bookingId], references: [id])
  modifiedBy   String   // admin user ID
  modifiedAt   DateTime @default(now())
  previousData Json     // store old values
  newData      Json     // store new values
  reason       String?
  emailSent    Boolean  @default(false)
}
```

**Update Booking model**:
```prisma
model Booking {
  // ... existing fields
  modifications BookingModification[]
}
```

### 8. UI Components for Edit Mode

**Date Picker Component**:
- Limit to 31 days in advance
- Disable past dates
- Show availability indicators

**Time Slot Selector**:
- Display available time slots (10pm-3am)
- Show conflicts in red
- Available slots in green

**Table Selector**:
- Interactive dropdown or grid
- Show capacity (min-max guests)
- Indicate VIP tables
- Show features
- Real-time availability status

**Confirmation Modal**:
- Summary of all changes
- Modification reason input
- Email notification checkbox
- Confirm/Cancel buttons

### 9. Validation Rules

**Business Rules**:
1. Bookings can only be made up to 31 days in advance
2. Party size must be between 2-12 guests
3. Party size must fit table capacity (min-max)
4. Tables 15 & 16 can be combined for 7-12 guests
5. No double-booking allowed
6. VIP table (Table 10) requires special handling
7. Time slots are 2-hour blocks

**Validation Flow**:
1. Check date is within 31-day limit
2. Validate party size (2-12)
3. Check table capacity matches party size
4. Verify table availability for date/time
5. Check for booking conflicts
6. Validate table combination rules if applicable

### 10. Testing Scenarios

**Test Cases**:
1. **Basic Modification**:
   - Change date only
   - Change time only
   - Change party size only
   - Change table only

2. **Complex Modifications**:
   - Change multiple fields
   - Move from regular to VIP table
   - Move from single to combined tables
   - Move from combined to single table

3. **Validation Testing**:
   - Try to double-book a table
   - Exceed party size limits
   - Book beyond 31-day limit
   - Invalid table capacity for party size

4. **Email Testing**:
   - Send modification email
   - Email with reason
   - Email without changes (should prevent)

5. **Edge Cases**:
   - Modify cancelled booking (should prevent)
   - Modify completed booking (should prevent)
   - Concurrent modifications (locking)

## File Structure

```
/app
  /admin
    /dashboard
      /bookings
        /[id]
          page.tsx (modify - add edit mode)
  /api
    /admin
      /bookings
        /[id]
          route.ts (modify - enhance PATCH)
          /check-availability
            route.ts (create new)
          /send-modification-email
            route.ts (create new)

/src
  /lib
    /booking
      availability.ts (create new)
    /email
      /templates
        booking-modification.ts (create new)

/prisma
  schema.prisma (modify - add BookingModification model)
```

## Security Considerations

1. **Authentication**: Only authenticated admin users can modify bookings
2. **Authorization**: Check admin role before allowing modifications
3. **Audit Trail**: All changes logged with admin user ID and timestamp
4. **Data Integrity**: Transaction-based updates to prevent partial changes
5. **Email Security**: Optional email notifications with admin approval
6. **Input Validation**: Sanitize all inputs before processing

## UI/UX Considerations

1. **Visual Feedback**:
   - Loading states during availability checks
   - Success/error messages
   - Color coding for availability (green/red)
   - Clear indication of what changed

2. **User Experience**:
   - Smooth transitions between view/edit modes
   - Real-time validation feedback
   - Helpful error messages
   - Confirmation before saving
   - Undo capability (within session)

3. **Accessibility**:
   - Keyboard navigation support
   - Screen reader friendly
   - Clear focus indicators
   - Descriptive labels and ARIA attributes

## Success Metrics

1. **Functional Success**:
   - All bookings can be modified by admin
   - No double-bookings occur
   - Email notifications sent successfully
   - Modification history tracked accurately

2. **Performance Metrics**:
   - Availability check < 500ms
   - Save operation < 1 second
   - Email send < 2 seconds
   - Page load < 1 second

3. **User Satisfaction**:
   - Clear and intuitive interface
   - Helpful validation messages
   - Successful email delivery
   - Accurate modification tracking

## Implementation Priority

1. **Phase 1 - Core Functionality** (High Priority):
   - Availability validation helpers
   - Basic edit mode UI
   - Enhanced PATCH endpoint
   - Database schema update

2. **Phase 2 - Email & Notifications** (Medium Priority):
   - Email template creation
   - Send email endpoint
   - Email integration in UI

3. **Phase 3 - Advanced Features** (Low Priority):
   - Modification history view
   - Bulk modifications
   - Recurring booking modifications
   - Advanced reporting

## Notes

- This feature enhances the admin dashboard completed in Phase 7
- Builds upon existing email infrastructure from Phase 6
- Maintains consistency with the prohibition theme
- Follows existing code patterns and conventions
- Edge Runtime compatible for deployment

## Next Steps

1. Create availability validation helpers
2. Update booking detail page with edit mode
3. Enhance API endpoints
4. Create email templates
5. Test all functionality
6. Document for admin users