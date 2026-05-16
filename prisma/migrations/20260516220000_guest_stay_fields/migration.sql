-- Add stay-state fields to Guest
ALTER TABLE "Guest" ADD COLUMN "arrivalAt" TIMESTAMP(3);
ALTER TABLE "Guest" ADD COLUMN "departureAt" TIMESTAMP(3);
ALTER TABLE "Guest" ADD COLUMN "stayState" TEXT NOT NULL DEFAULT 'past';
ALTER TABLE "Guest" ADD COLUMN "visitCount" INTEGER NOT NULL DEFAULT 0;
