CREATE TYPE "public"."price_alert_status" AS ENUM('active', 'paused', 'triggered', 'expired');--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"origin" varchar(3) NOT NULL,
	"destination" varchar(3) NOT NULL,
	"departure_date" varchar(10) NOT NULL,
	"return_date" varchar(10),
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"infants" integer DEFAULT 0 NOT NULL,
	"cabin_class" "cabin_class" DEFAULT 'economy' NOT NULL,
	"currency" varchar(3) DEFAULT 'BDT' NOT NULL,
	"target_price" integer,
	"last_seen_price" integer,
	"lowest_seen_price" integer,
	"status" "price_alert_status" DEFAULT 'active' NOT NULL,
	"last_notified_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_alerts_unique" UNIQUE NULLS NOT DISTINCT("user_id","origin","destination","departure_date","return_date","cabin_class","adults","children","infants")
);
--> statement-breakpoint
CREATE INDEX "price_alerts_user_id_idx" ON "price_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "price_alerts_status_idx" ON "price_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "price_alerts_sweep_idx" ON "price_alerts" USING btree ("status","last_checked_at");