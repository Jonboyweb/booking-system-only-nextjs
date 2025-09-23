-- CreateIndex
CREATE INDEX "bookings_bookingReference_idx" ON "public"."bookings"("bookingReference");

-- CreateIndex
CREATE INDEX "bookings_bookingDate_bookingTime_idx" ON "public"."bookings"("bookingDate", "bookingTime");

-- CreateIndex
CREATE INDEX "bookings_customerId_idx" ON "public"."bookings"("customerId");

-- CreateIndex
CREATE INDEX "bookings_status_bookingDate_idx" ON "public"."bookings"("status", "bookingDate");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "public"."bookings"("createdAt");

-- CreateIndex
CREATE INDEX "tables_floor_isActive_idx" ON "public"."tables"("floor", "isActive");

-- CreateIndex
CREATE INDEX "tables_capacityMin_idx" ON "public"."tables"("capacityMin");

-- CreateIndex
CREATE INDEX "tables_capacityMax_idx" ON "public"."tables"("capacityMax");
