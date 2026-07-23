export type BookingStatus =
  | "Confirmed"
  | "Ticketed"
  | "Pending Payment"
  | "On Hold"
  | "Cancellation Requested"
  | "Cancelled"
  | "Refund In Progress"
  | "Refunded"
  | "Expired";

export interface BookingTraveller {
  title: string;
  firstName: string;
  surname: string;
  type: "adult" | "child" | "kid" | "infant";
  dob: string;
  nationality: string;
  seat?: string;
  baggage: string;
  meal?: string;
  passportNumber?: string;
}

export interface BookingSegment {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  cabin: string;
  aircraft: string;
}

export interface BookingActivity {
  timestamp: string;
  action: string;
  actor: string;
  detail?: string;
}

export interface Booking {
  reference: string;
  pnr: string;
  status: BookingStatus;
  route: string;
  origin: string;
  destination: string;
  departureDate: string;
  tripType: "one_way" | "round_trip" | "multi_city";
  travellers: BookingTraveller[];
  segments: BookingSegment[];
  totalFare: number;
  baseFare: number;
  taxes: number;
  discount: number;
  promoCode?: string;
  paymentMethod: string;
  transactionId: string;
  paidAt: string;
  issuedAt: string;
  activities: BookingActivity[];
}

function generateReference(index: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "AKJ-";
  for (let i = 0; i < 6; i++) {
    ref += chars[(index * 7 + i * 13) % chars.length];
  }
  return ref;
}

function generatePNR(index: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pnr = "";
  for (let i = 0; i < 6; i++) {
    pnr += chars[(index * 11 + i * 17) % chars.length];
  }
  return pnr;
}

function generateTransactionId(index: number): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `TXN${dateStr}${String(index + 1000).padStart(6, "0")}`;
}

export const bookings: Booking[] = [
  {
    reference: "AKJ-8F2K9L",
    pnr: "X4TR9B",
    status: "Ticketed",
    route: "DAC → CXB",
    origin: "DAC",
    destination: "CXB",
    departureDate: "2026-07-30",
    tripType: "one_way",
    travellers: [
      { title: "Mr.", firstName: "S M Moshiur", surname: "Rahman", type: "adult", dob: "1990-05-15", nationality: "Bangladeshi", seat: "12A", baggage: "20 Kg", meal: "Standard", passportNumber: "BP1234567" },
    ],
    segments: [
      { airline: "BS", flightNumber: "BS-159", origin: "DAC", destination: "CXB", departureDate: "2026-07-30", departureTime: "19:00", arrivalTime: "20:05", duration: 65, cabin: "Economy", aircraft: "Boeing 737-800" },
    ],
    totalFare: 5089,
    baseFare: 3031,
    taxes: 1139,
    discount: 1031,
    promoCode: "FTEBLDOM07",
    paymentMethod: "bKash",
    transactionId: "TXN20260730100001",
    paidAt: "2026-07-23T10:30:00",
    issuedAt: "2026-07-23T10:35:00",
    activities: [
      { timestamp: "2026-07-23T10:25:00", action: "Booking created", actor: "System", detail: "Booking reference AKJ-8F2K9L generated" },
      { timestamp: "2026-07-23T10:30:00", action: "Payment received", actor: "System", detail: "BDT 5,089 via bKash" },
      { timestamp: "2026-07-23T10:35:00", action: "Ticket issued", actor: "System", detail: "PNR X4TR9B confirmed" },
    ],
  },
  {
    reference: "AKJ-7G1M3P",
    pnr: "Y8HN2K",
    status: "Confirmed",
    route: "DAC → ZYL",
    origin: "DAC",
    destination: "ZYL",
    departureDate: "2026-08-15",
    tripType: "round_trip",
    travellers: [
      { title: "Mrs.", firstName: "Nusrat", surname: "Jahan", type: "adult", dob: "1993-08-22", nationality: "Bangladeshi", seat: "14C", baggage: "20 Kg" },
    ],
    segments: [
      { airline: "BG", flightNumber: "BG-601", origin: "DAC", destination: "ZYL", departureDate: "2026-08-15", departureTime: "08:40", arrivalTime: "09:50", duration: 70, cabin: "Economy", aircraft: "ATR 72" },
      { airline: "BG", flightNumber: "BG-602", origin: "ZYL", destination: "DAC", departureDate: "2026-08-20", departureTime: "16:50", arrivalTime: "18:00", duration: 70, cabin: "Economy", aircraft: "ATR 72" },
    ],
    totalFare: 7200,
    baseFare: 6000,
    taxes: 1200,
    discount: 0,
    paymentMethod: "Credit Card",
    transactionId: "TXN20260722100002",
    paidAt: "2026-07-22T14:00:00",
    issuedAt: "2026-07-22T14:05:00",
    activities: [
      { timestamp: "2026-07-22T13:55:00", action: "Booking created", actor: "System" },
      { timestamp: "2026-07-22T14:00:00", action: "Payment received", actor: "System" },
    ],
  },
  {
    reference: "AKJ-5K4N7J",
    pnr: "F3DC8M",
    status: "Pending Payment",
    route: "DAC → CGP",
    origin: "DAC",
    destination: "CGP",
    departureDate: "2026-07-28",
    tripType: "one_way",
    travellers: [
      { title: "Mr.", firstName: "Tanvir", surname: "Hossain", type: "adult", dob: "1988-12-03", nationality: "Bangladeshi", baggage: "20 Kg" },
    ],
    segments: [
      { airline: "2A", flightNumber: "2A-401", origin: "DAC", destination: "CGP", departureDate: "2026-07-28", departureTime: "15:30", arrivalTime: "16:35", duration: 65, cabin: "Economy", aircraft: "DHC8 Dash 8" },
    ],
    totalFare: 4500,
    baseFare: 3800,
    taxes: 700,
    discount: 0,
    paymentMethod: "Nagad",
    transactionId: "TXN20260720100003",
    paidAt: "",
    issuedAt: "",
    activities: [
      { timestamp: "2026-07-20T09:00:00", action: "Booking created", actor: "System", detail: "Awaiting payment" },
    ],
  },
  {
    reference: "AKJ-3P8L2X",
    pnr: "W7RK9V",
    status: "Cancellation Requested",
    route: "DAC → JSR",
    origin: "DAC",
    destination: "JSR",
    departureDate: "2026-07-25",
    tripType: "one_way",
    travellers: [
      { title: "Mr.", firstName: "Rahim", surname: "Miah", type: "adult", dob: "1985-03-12", nationality: "Bangladeshi", baggage: "20 Kg" },
    ],
    segments: [
      { airline: "VQ", flightNumber: "VQ-901", origin: "DAC", destination: "JSR", departureDate: "2026-07-25", departureTime: "10:15", arrivalTime: "11:15", duration: 60, cabin: "Economy", aircraft: "DHC8 Dash 8" },
    ],
    totalFare: 4200,
    baseFare: 3700,
    taxes: 500,
    discount: 0,
    paymentMethod: "bKash",
    transactionId: "TXN20260718100004",
    paidAt: "2026-07-18T11:00:00",
    issuedAt: "2026-07-18T11:05:00",
    activities: [
      { timestamp: "2026-07-18T10:55:00", action: "Booking created", actor: "System" },
      { timestamp: "2026-07-18T11:00:00", action: "Payment received", actor: "System" },
      { timestamp: "2026-07-18T11:05:00", action: "Ticket issued", actor: "System" },
      { timestamp: "2026-07-20T15:30:00", action: "Cancellation requested", actor: "Customer", detail: "Change of plans" },
    ],
  },
  {
    reference: "AKJ-9H6F5D",
    pnr: "K2MC4L",
    status: "Refund In Progress",
    route: "DAC → CXB",
    origin: "DAC",
    destination: "CXB",
    departureDate: "2026-07-22",
    tripType: "one_way",
    travellers: [
      { title: "Ms.", firstName: "Fatima", surname: "Begum", type: "adult", dob: "1995-07-08", nationality: "Bangladeshi", baggage: "20 Kg" },
    ],
    segments: [
      { airline: "BS", flightNumber: "BS-161", origin: "DAC", destination: "CXB", departureDate: "2026-07-22", departureTime: "07:10", arrivalTime: "08:15", duration: 65, cabin: "Economy", aircraft: "Boeing 737-800" },
    ],
    totalFare: 4710,
    baseFare: 3500,
    taxes: 1210,
    discount: 0,
    paymentMethod: "Visa",
    transactionId: "TXN20260715100005",
    paidAt: "2026-07-15T09:30:00",
    issuedAt: "2026-07-15T09:35:00",
    activities: [
      { timestamp: "2026-07-15T09:25:00", action: "Booking created", actor: "System" },
      { timestamp: "2026-07-15T09:30:00", action: "Payment received", actor: "System" },
      { timestamp: "2026-07-21T14:00:00", action: "Cancellation requested", actor: "Customer" },
      { timestamp: "2026-07-21T14:05:00", action: "Cancellation approved", actor: "System" },
      { timestamp: "2026-07-21T14:05:00", action: "Refund initiated", actor: "System", detail: "BDT 3,210 refund to Visa card" },
    ],
  },
  {
    reference: "AKJ-4T8B2W",
    pnr: "N9VX6P",
    status: "Cancelled",
    route: "DAC → CGP",
    origin: "DAC",
    destination: "CGP",
    departureDate: "2026-07-10",
    tripType: "one_way",
    travellers: [
      { title: "Mr.", firstName: "Kabir", surname: "Hossain", type: "adult", dob: "1978-11-20", nationality: "Bangladeshi", baggage: "20 Kg" },
    ],
    segments: [
      { airline: "BG", flightNumber: "BG-605", origin: "DAC", destination: "CGP", departureDate: "2026-07-10", departureTime: "13:40", arrivalTime: "14:45", duration: 65, cabin: "Economy", aircraft: "Boeing 737-800" },
    ],
    totalFare: 4300,
    baseFare: 3800,
    taxes: 500,
    discount: 0,
    paymentMethod: "Rocket",
    transactionId: "TXN20260705100006",
    paidAt: "2026-07-05T16:00:00",
    issuedAt: "2026-07-05T16:05:00",
    activities: [
      { timestamp: "2026-07-05T15:55:00", action: "Booking created", actor: "System" },
      { timestamp: "2026-07-05T16:00:00", action: "Payment received", actor: "System" },
      { timestamp: "2026-07-09T10:00:00", action: "Cancellation requested", actor: "Customer" },
      { timestamp: "2026-07-09T10:05:00", action: "Cancelled", actor: "System" },
    ],
  },
  {
    reference: "AKJ-6D1G9H",
    pnr: "B4KR8M",
    status: "Expired",
    route: "DAC → CXB",
    origin: "DAC",
    destination: "CXB",
    departureDate: "2026-07-01",
    tripType: "one_way",
    travellers: [
      { title: "Mr.", firstName: "Shahidul", surname: "Islam", type: "adult", dob: "1982-04-30", nationality: "Bangladeshi", baggage: "20 Kg" },
    ],
    segments: [
      { airline: "2A", flightNumber: "2A-405", origin: "DAC", destination: "CXB", departureDate: "2026-07-01", departureTime: "18:30", arrivalTime: "19:40", duration: 70, cabin: "Economy", aircraft: "DHC8 Dash 8" },
    ],
    totalFare: 4500,
    baseFare: 3800,
    taxes: 700,
    discount: 0,
    paymentMethod: "bKash",
    transactionId: "TXN20260628100007",
    paidAt: "2026-06-28T12:00:00",
    issuedAt: "2026-06-28T12:05:00",
    activities: [
      { timestamp: "2026-06-28T11:55:00", action: "Booking created", actor: "System" },
      { timestamp: "2026-06-28T12:00:00", action: "Payment received", actor: "System" },
      { timestamp: "2026-07-02T00:00:00", action: "Expired", actor: "System", detail: "Flight departed without check-in" },
    ],
  },
  {
    reference: "AKJ-2P7L4M",
    pnr: "S5FN9W",
    status: "On Hold",
    route: "DAC → CXB",
    origin: "DAC",
    destination: "CXB",
    departureDate: "2026-08-05",
    tripType: "round_trip",
    travellers: [
      { title: "Mr.", firstName: "Arif", surname: "Khan", type: "adult", dob: "1991-09-18", nationality: "Bangladeshi", baggage: "20 Kg" },
    ],
    segments: [
      { airline: "BS", flightNumber: "BS-163", origin: "DAC", destination: "CXB", departureDate: "2026-08-05", departureTime: "19:00", arrivalTime: "20:05", duration: 65, cabin: "Economy", aircraft: "Boeing 737-800" },
      { airline: "BS", flightNumber: "BS-164", origin: "CXB", destination: "DAC", departureDate: "2026-08-08", departureTime: "07:10", arrivalTime: "08:15", duration: 65, cabin: "Economy", aircraft: "Boeing 737-800" },
    ],
    totalFare: 9600,
    baseFare: 8000,
    taxes: 1600,
    discount: 0,
    paymentMethod: "Pay Later",
    transactionId: "TXN20260719100008",
    paidAt: "",
    issuedAt: "",
    activities: [
      { timestamp: "2026-07-19T08:00:00", action: "Booking created", actor: "System", detail: "On hold — pay by 25 Jul 2026" },
    ],
  },
];
