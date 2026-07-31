import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "enduser",
  "agency",
  "partner",
  "superadmin",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "deleted",
]);

export const orgTypeEnum = pgEnum("org_type", [
  "individual",
  "agency",
  "partner",
  "franchise",
]);

export const tierEnum = pgEnum("tier", ["free", "premium", "enterprise"]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending_payment",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
]);

export const cabinClassEnum = pgEnum("cabin_class", [
  "economy",
  "premium_economy",
  "business",
  "first",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe",
  "bkash",
  "nagad",
  "rocket",
  "bank_transfer",
]);

export const supportStatusEnum = pgEnum("support_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

export const commissionStatusEnum = pgEnum("commission_status", [
  "pending",
  "earned",
  "paid",
]);

// Tables

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull(),
    orgId: uuid("org_id"),
    status: userStatusEnum("status").notNull().default("active"),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastLogin: timestamp("last_login"),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    phoneIdx: index("users_phone_idx").on(table.phone),
    roleIdx: index("users_role_idx").on(table.role),
    orgIdIdx: index("users_org_id_idx").on(table.orgId),
  })
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    type: orgTypeEnum("type").notNull(),
    country: varchar("country", { length: 2 }).notNull().default("BD"),
    currency: varchar("currency", { length: 3 }).notNull().default("BDT"),
    tier: tierEnum("tier").notNull().default("free"),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
    paymentMethod: paymentMethodEnum("payment_method"),
    paymentAccount: varchar("payment_account", { length: 255 }),
    taxId: varchar("tax_id", { length: 50 }),
    apiKey: varchar("api_key", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    typeIdx: index("organizations_type_idx").on(table.type),
    tierIdx: index("organizations_tier_idx").on(table.tier),
  })
);

export const airlines = pgTable(
  "airlines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    iataCode: varchar("iata_code", { length: 3 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    logoUrl: text("logo_url"),
    country: varchar("country", { length: 255 }),
    alliance: varchar("alliance", { length: 50 }),
    rating: decimal("rating", { precision: 2, scale: 1 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    iataCodeIdx: uniqueIndex("airlines_iata_code_idx").on(table.iataCode),
  })
);

export const airports = pgTable(
  "airports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    iataCode: varchar("iata_code", { length: 3 }).notNull().unique(),
    icaoCode: varchar("icao_code", { length: 4 }),
    city: varchar("city", { length: 255 }).notNull(),
    cityBn: varchar("city_bn", { length: 255 }),
    country: varchar("country", { length: 255 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    timezone: varchar("timezone", { length: 50 }),
    popular: integer("popular").default(0),
    domestic: boolean("domestic").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    iataCodeIdx: uniqueIndex("airports_iata_code_idx").on(table.iataCode),
    countryIdx: index("airports_country_idx").on(table.country),
    domesticIdx: index("airports_domestic_idx").on(table.domestic),
  })
);

export const flights = pgTable(
  "flights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    airlineId: uuid("airline_id").notNull(),
    flightNumber: varchar("flight_number", { length: 10 }).notNull(),
    departureAirportId: uuid("departure_airport_id").notNull(),
    arrivalAirportId: uuid("arrival_airport_id").notNull(),
    departureTime: timestamp("departure_time").notNull(),
    arrivalTime: timestamp("arrival_time").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    aircraftType: varchar("aircraft_type", { length: 50 }),
    stops: integer("stops").default(0),
    layoverAirports: text("layover_airports"),
    basePrice: integer("base_price").notNull(),
    currency: varchar("currency", { length: 3 }).default("BDT"),
    seatsAvailable: integer("seats_available").notNull(),
    seatsEconomy: integer("seats_economy").notNull(),
    seatsBusiness: integer("seats_business").default(0),
    seatsFirst: integer("seats_first").default(0),
    operatingDays: varchar("operating_days", { length: 7 }),
    iataData: jsonb("iata_data"),
    source: varchar("source", { length: 50 }).default("mock"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    airlineIdIdx: index("flights_airline_id_idx").on(table.airlineId),
    departureAirportIdIdx: index("flights_departure_airport_id_idx").on(
      table.departureAirportId
    ),
    arrivalAirportIdIdx: index("flights_arrival_airport_id_idx").on(
      table.arrivalAirportId
    ),
    departurTimeIdx: index("flights_departure_time_idx").on(
      table.departureTime
    ),
  })
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingRef: varchar("booking_ref", { length: 10 }).notNull().unique(),
    userId: uuid("user_id").notNull(),
    orgId: uuid("org_id"),
    flightId: uuid("flight_id").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending_payment"),
    passengers: jsonb("passengers").notNull(),
    cabinClass: cabinClassEnum("cabin_class").notNull(),
    totalPrice: integer("total_price").notNull(),
    discount: integer("discount").default(0),
    finalPrice: integer("final_price").notNull(),
    ancillaries: jsonb("ancillaries"),
    paymentId: uuid("payment_id"),
    paymentMethod: paymentMethodEnum("payment_method"),
    cancellationReason: text("cancellation_reason"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    bookingRefIdx: uniqueIndex("bookings_booking_ref_idx").on(table.bookingRef),
    userIdIdx: index("bookings_user_id_idx").on(table.userId),
    flightIdIdx: index("bookings_flight_id_idx").on(table.flightId),
    statusIdx: index("bookings_status_idx").on(table.status),
    createdAtIdx: index("bookings_created_at_idx").on(table.createdAt),
  })
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).default("BDT"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    bkashTransactionId: varchar("bkash_transaction_id", { length: 255 }),
    processorResponse: jsonb("processor_response"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    bookingIdIdx: index("payments_booking_id_idx").on(table.bookingId),
    statusIdx: index("payments_status_idx").on(table.status),
  })
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull(),
    userId: uuid("user_id").notNull(),
    airlineId: uuid("airline_id").notNull(),
    route: varchar("route", { length: 20 }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    verifiedBooking: boolean("verified_booking").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    airlineIdIdx: index("reviews_airline_id_idx").on(table.airlineId),
    userIdIdx: index("reviews_user_id_idx").on(table.userId),
  })
);

export const agencyCommissions = pgTable(
  "agency_commissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    bookingId: uuid("booking_id").notNull(),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
    commissionAmount: integer("commission_amount").notNull(),
    status: commissionStatusEnum("status").notNull().default("pending"),
    invoiceId: uuid("invoice_id"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    orgIdIdx: index("agency_commissions_org_id_idx").on(table.orgId),
    bookingIdIdx: index("agency_commissions_booking_id_idx").on(table.bookingId),
    statusIdx: index("agency_commissions_status_idx").on(table.status),
  })
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    totalBookings: integer("total_bookings").default(0),
    totalCommission: integer("total_commission").default(0),
    status: varchar("status", { length: 20 }).default("draft"),
    paymentMethod: varchar("payment_method", { length: 50 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
  },
  (table) => ({
    orgIdIdx: index("invoices_org_id_idx").on(table.orgId),
    invoiceNumberIdx: uniqueIndex("invoices_invoice_number_idx").on(
      table.invoiceNumber
    ),
  })
);

export const partnerReferrals = pgTable(
  "partner_referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id").notNull(),
    uniqueLink: varchar("unique_link", { length: 255 }).notNull().unique(),
    bookingId: uuid("booking_id"),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
    earnedAmount: integer("earned_amount").default(0),
    status: commissionStatusEnum("status").notNull().default("pending"),
    clickedAt: timestamp("clicked_at"),
    bookedAt: timestamp("booked_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    partnerIdIdx: index("partner_referrals_partner_id_idx").on(table.partnerId),
    uniqueLinkIdx: uniqueIndex("partner_referrals_unique_link_idx").on(
      table.uniqueLink
    ),
    bookingIdIdx: index("partner_referrals_booking_id_idx").on(table.bookingId),
  })
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    bookingId: uuid("booking_id"),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    status: supportStatusEnum("status").notNull().default("open"),
    priority: priorityEnum("priority").notNull().default("medium"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => ({
    userIdIdx: index("support_tickets_user_id_idx").on(table.userId),
    statusIdx: index("support_tickets_status_idx").on(table.status),
  })
);

export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export type Airline = typeof airlines.$inferSelect;
export type InsertAirline = typeof airlines.$inferInsert;

export type Airport = typeof airports.$inferSelect;
export type InsertAirport = typeof airports.$inferInsert;

export type Flight = typeof flights.$inferSelect;
export type InsertFlight = typeof flights.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type AgencyCommission = typeof agencyCommissions.$inferSelect;
export type InsertAgencyCommission = typeof agencyCommissions.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export type PartnerReferral = typeof partnerReferrals.$inferSelect;
export type InsertPartnerReferral = typeof partnerReferrals.$inferInsert;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;
