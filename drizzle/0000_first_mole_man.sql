CREATE TYPE "public"."booking_status" AS ENUM('pending_payment', 'confirmed', 'checked_in', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cabin_class" AS ENUM('economy', 'premium_economy', 'business', 'first');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('pending', 'earned', 'paid');--> statement-breakpoint
CREATE TYPE "public"."org_type" AS ENUM('individual', 'agency', 'partner', 'franchise');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe', 'bkash', 'nagad', 'rocket', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."support_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('free', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('enduser', 'agency', 'partner', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "agency_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"commission_rate" numeric(5, 2),
	"commission_amount" integer NOT NULL,
	"status" "commission_status" DEFAULT 'pending' NOT NULL,
	"invoice_id" uuid,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "airlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iata_code" varchar(3) NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" text,
	"country" varchar(255),
	"alliance" varchar(50),
	"rating" numeric(2, 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "airlines_iata_code_unique" UNIQUE("iata_code")
);
--> statement-breakpoint
CREATE TABLE "airports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iata_code" varchar(3) NOT NULL,
	"icao_code" varchar(4),
	"city" varchar(255) NOT NULL,
	"city_bn" varchar(255),
	"country" varchar(255) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"timezone" varchar(50),
	"popular" integer DEFAULT 0,
	"domestic" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "airports_iata_code_unique" UNIQUE("iata_code")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_ref" varchar(10) NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid,
	"flight_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'pending_payment' NOT NULL,
	"passengers" jsonb NOT NULL,
	"cabin_class" "cabin_class" NOT NULL,
	"total_price" integer NOT NULL,
	"discount" integer DEFAULT 0,
	"final_price" integer NOT NULL,
	"ancillaries" jsonb,
	"payment_id" uuid,
	"payment_method" "payment_method",
	"cancellation_reason" text,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_ref_unique" UNIQUE("booking_ref")
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airline_id" uuid NOT NULL,
	"flight_number" varchar(10) NOT NULL,
	"departure_airport_id" uuid NOT NULL,
	"arrival_airport_id" uuid NOT NULL,
	"departure_time" timestamp NOT NULL,
	"arrival_time" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"aircraft_type" varchar(50),
	"stops" integer DEFAULT 0,
	"layover_airports" text,
	"base_price" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'BDT',
	"seats_available" integer NOT NULL,
	"seats_economy" integer NOT NULL,
	"seats_business" integer DEFAULT 0,
	"seats_first" integer DEFAULT 0,
	"operating_days" varchar(7),
	"iata_data" jsonb,
	"source" varchar(50) DEFAULT 'mock',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_bookings" integer DEFAULT 0,
	"total_commission" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'draft',
	"payment_method" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "org_type" NOT NULL,
	"country" varchar(2) DEFAULT 'BD' NOT NULL,
	"currency" varchar(3) DEFAULT 'BDT' NOT NULL,
	"tier" "tier" DEFAULT 'free' NOT NULL,
	"commission_rate" numeric(5, 2),
	"payment_method" "payment_method",
	"payment_account" varchar(255),
	"tax_id" varchar(50),
	"api_key" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"unique_link" varchar(255) NOT NULL,
	"booking_id" uuid,
	"commission_rate" numeric(5, 2),
	"earned_amount" integer DEFAULT 0,
	"status" "commission_status" DEFAULT 'pending' NOT NULL,
	"clicked_at" timestamp,
	"booked_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_referrals_unique_link_unique" UNIQUE("unique_link")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'BDT',
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"bkash_transaction_id" varchar(255),
	"processor_response" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"airline_id" uuid NOT NULL,
	"route" varchar(20),
	"rating" integer NOT NULL,
	"comment" text,
	"verified_booking" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "support_status" DEFAULT 'open' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255),
	"full_name" varchar(255) NOT NULL,
	"avatar_url" text,
	"role" "user_role" NOT NULL,
	"org_id" uuid,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "agency_commissions_org_id_idx" ON "agency_commissions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "agency_commissions_booking_id_idx" ON "agency_commissions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "agency_commissions_status_idx" ON "agency_commissions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "airlines_iata_code_idx" ON "airlines" USING btree ("iata_code");--> statement-breakpoint
CREATE UNIQUE INDEX "airports_iata_code_idx" ON "airports" USING btree ("iata_code");--> statement-breakpoint
CREATE INDEX "airports_country_idx" ON "airports" USING btree ("country");--> statement-breakpoint
CREATE INDEX "airports_domestic_idx" ON "airports" USING btree ("domestic");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_booking_ref_idx" ON "bookings" USING btree ("booking_ref");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_flight_id_idx" ON "bookings" USING btree ("flight_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "flights_airline_id_idx" ON "flights" USING btree ("airline_id");--> statement-breakpoint
CREATE INDEX "flights_departure_airport_id_idx" ON "flights" USING btree ("departure_airport_id");--> statement-breakpoint
CREATE INDEX "flights_arrival_airport_id_idx" ON "flights" USING btree ("arrival_airport_id");--> statement-breakpoint
CREATE INDEX "flights_departure_time_idx" ON "flights" USING btree ("departure_time");--> statement-breakpoint
CREATE INDEX "invoices_org_id_idx" ON "invoices" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "organizations_type_idx" ON "organizations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "organizations_tier_idx" ON "organizations" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "partner_referrals_partner_id_idx" ON "partner_referrals" USING btree ("partner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_referrals_unique_link_idx" ON "partner_referrals" USING btree ("unique_link");--> statement-breakpoint
CREATE INDEX "partner_referrals_booking_id_idx" ON "partner_referrals" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_airline_id_idx" ON "reviews" USING btree ("airline_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_org_id_idx" ON "users" USING btree ("org_id");