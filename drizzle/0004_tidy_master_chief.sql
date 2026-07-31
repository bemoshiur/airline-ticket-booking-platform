CREATE TYPE "public"."ancillary_category" AS ENUM('baggage', 'seat', 'meal', 'insurance', 'lounge', 'priority', 'other');--> statement-breakpoint
CREATE TYPE "public"."ancillary_unit" AS ENUM('per_passenger', 'per_booking', 'per_segment');--> statement-breakpoint
CREATE TABLE "ancillary_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(120) NOT NULL,
	"name_bn" varchar(120),
	"description" text,
	"category" "ancillary_category" NOT NULL,
	"unit" "ancillary_unit" NOT NULL,
	"price" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'BDT' NOT NULL,
	"max_quantity" integer DEFAULT 1 NOT NULL,
	"cabin_classes" varchar(120),
	"international_only" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ancillary_products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "ancillaries_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ancillary_products_code_idx" ON "ancillary_products" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ancillary_products_active_idx" ON "ancillary_products" USING btree ("active");