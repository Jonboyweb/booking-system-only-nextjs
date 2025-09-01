-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "depositRefunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "refundAmount" INTEGER,
ADD COLUMN     "refundDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."booking_spirits" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "spiritId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_spirits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_champagnes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "champagneId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_champagnes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_logs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_modifications" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "modifiedBy" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousData" JSONB NOT NULL,
    "newData" JSONB NOT NULL,
    "reason" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "booking_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_spirits_bookingId_spiritId_key" ON "public"."booking_spirits"("bookingId", "spiritId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_champagnes_bookingId_champagneId_key" ON "public"."booking_champagnes"("bookingId", "champagneId");

-- CreateIndex
CREATE INDEX "payment_logs_bookingId_idx" ON "public"."payment_logs"("bookingId");

-- CreateIndex
CREATE INDEX "payment_logs_stripePaymentId_idx" ON "public"."payment_logs"("stripePaymentId");

-- CreateIndex
CREATE INDEX "booking_modifications_bookingId_idx" ON "public"."booking_modifications"("bookingId");

-- AddForeignKey
ALTER TABLE "public"."booking_spirits" ADD CONSTRAINT "booking_spirits_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_spirits" ADD CONSTRAINT "booking_spirits_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "public"."spirits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_champagnes" ADD CONSTRAINT "booking_champagnes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_champagnes" ADD CONSTRAINT "booking_champagnes_champagneId_fkey" FOREIGN KEY ("champagneId") REFERENCES "public"."champagnes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_logs" ADD CONSTRAINT "payment_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_modifications" ADD CONSTRAINT "booking_modifications_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
