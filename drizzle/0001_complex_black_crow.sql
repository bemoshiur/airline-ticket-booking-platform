ALTER TABLE "bookings" ALTER COLUMN "flight_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "offer_source" varchar(32) DEFAULT 'database' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "offer_id" varchar(200);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "itinerary" jsonb;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "currency" varchar(3) DEFAULT 'BDT' NOT NULL;--> statement-breakpoint
CREATE INDEX "bookings_offer_id_idx" ON "bookings" USING btree ("offer_id");