CREATE UNIQUE INDEX "Review_bookingId_userId_key" ON "Review"("bookingId", "userId");
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
