import { SeededPRNG } from "@/lib/utils/prng";
import { getAirline } from "./airlines";
import { fareFamilies, getFareFamily } from "./fares";
import { promoCodes } from "./promos";
import { getAircraft } from "./aircraft";
import { getAirport } from "./airports";

export interface FlightSegment {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // minutes
  aircraft: string;
  aircraftName: string;
  stops: number;
  layoverAirports?: string[];
  layoverDurations?: number[];
}

export interface FareOption {
  id: string;
  fareFamilyId: string;
  totalFare: number;
  baseFare: number;
  taxes: number;
  seatsLeft: number;
  rbd: string;
}

export interface FlightResult {
  id: string;
  segments: FlightSegment[];
  fareOptions: FareOption[];
  totalDuration: number;
  refundable: boolean;
  recommended: boolean;
  promoCode?: string;
  seatsLeft: number;
}

export interface SearchParams {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  returnDate?: string;
  tripType: "O" | "R" | "M";
  adult: number;
  child: number;
  kid: number;
  infant: number;
  cabinClass: string;
  fareType: "REGULAR" | "STUDENT";
  carriers?: string[];
  multiCity?: { origin: string; destination: string; date: string }[];
}

// Domestic time slots (realistic for BD OTA)
const DOMESTIC_TIMES = ["07:10", "08:40", "10:15", "13:40", "15:30", "16:50", "18:30", "19:00", "19:40", "20:00"];
const DOMESTIC_AIRCRAFT = ["ATR72", "B738", "DH8D"];
const INTERNATIONAL_AIRCRAFT = ["B738", "B789", "A320", "A350", "B773"];

// Duration ranges by route type
function getDurationRange(origin: string, dest: string): [number, number] {
  const domesticPairs: Record<string, [number, number]> = {
    "DAC-CXB": [55, 75],
    "CXB-DAC": [55, 75],
    "DAC-CGP": [50, 70],
    "CGP-DAC": [50, 70],
    "DAC-ZYL": [55, 75],
    "ZYL-DAC": [55, 75],
    "DAC-SPD": [55, 75],
    "SPD-DAC": [55, 75],
    "DAC-RJH": [50, 65],
    "RJH-DAC": [50, 65],
    "DAC-BZL": [45, 60],
    "BZL-DAC": [45, 60],
    "DAC-JSR": [50, 65],
    "JSR-DAC": [50, 65],
  };
  const key = `${origin}-${dest}`;
  if (domesticPairs[key]) return domesticPairs[key];
  // International: 2-16 hours
  return [120, 960];
}

// Domestic price bands
function getPriceBand(origin: string, dest: string): [number, number] {
  const key = `${origin}-${dest}`;
  const reverse = `${dest}-${origin}`;
  const bands: Record<string, [number, number]> = {
    "DAC-CXB": [4100, 11900],
    "CXB-DAC": [4100, 11900],
    "DAC-ZYL": [3900, 9500],
    "ZYL-DAC": [3900, 9500],
    "DAC-CGP": [3800, 9000],
    "CGP-DAC": [3800, 9000],
    "DAC-JSR": [3700, 8500],
    "JSR-DAC": [3700, 8500],
    "DAC-SPD": [3700, 8500],
    "SPD-DAC": [3700, 8500],
    "DAC-RJH": [3600, 8200],
    "RJH-DAC": [3600, 8200],
    "DAC-BZL": [3500, 8000],
    "BZL-DAC": [3500, 8000],
  };
  return bands[key] || bands[reverse] || [5000, 25000];
}

const DOMESTIC_ROUTES = [
  ["DAC", "CXB"], ["DAC", "CGP"], ["DAC", "ZYL"], ["DAC", "SPD"],
  ["DAC", "RJH"], ["DAC", "BZL"], ["DAC", "JSR"],
  ["CXB", "DAC"], ["CGP", "DAC"], ["ZYL", "DAC"], ["SPD", "DAC"],
  ["RJH", "DAC"], ["BZL", "DAC"], ["JSR", "DAC"],
  ["CXB", "CGP"], ["CGP", "CXB"],
];

function isDomestic(origin: string, dest: string): boolean {
  return DOMESTIC_ROUTES.some(([o, d]) => o === origin && d === dest);
}

function generateFlightKey(prng: SeededPRNG, airline: string, origin: string, dest: string): string {
  const num = prng.nextInt(100, 999);
  return `${airline}-${num}`;
}

function generateTime(prng: SeededPRNG, index: number): string {
  // Return a realistic domestic time based on index and some randomness
  const baseIdx = index % DOMESTIC_TIMES.length;
  const timeSlot = DOMESTIC_TIMES[baseIdx];
  // Add slight variation
  const offset = prng.nextInt(-5, 5);
  const [h, m] = timeSlot.split(":").map(Number);
  const totalMins = h * 60 + m + offset;
  const clampedMins = Math.max(420, Math.min(1200, totalMins)); // 07:00 – 20:00
  return `${String(Math.floor(clampedMins / 60)).padStart(2, "0")}:${String(clampedMins % 60).padStart(2, "0")}`;
}

function generateInternationalTime(prng: SeededPRNG): string {
  const h = prng.nextInt(0, 23);
  const m = prng.nextInt(0, 3) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function searchFlights(params: SearchParams): FlightResult[] {
  const seed = `${params.origin}-${params.destination}-${params.date}-${params.cabinClass}-${params.fareType}-${params.adult}-${params.child}`;
  const prng = new SeededPRNG(seed);
  const domestic = isDomestic(params.origin, params.destination);

  // How many flights?
  const flightCount = domestic ? prng.nextInt(8, 25) : prng.nextInt(5, 15);

  const results: FlightResult[] = [];
  const domesticCarriers = ["BS", "BG", "2A", "VQ"];
  const internationalCarriers = ["EK", "QR", "SQ", "MH", "TK", "AI", "6E", "UL", "CX", "G9", "EY", "GF", "SV", "TG", "BS", "BG"];
  const carriers = domestic ? domesticCarriers : internationalCarriers;

  for (let i = 0; i < flightCount; i++) {
    const airlineCode = prng.pick(carriers.filter((c) => !params.carriers || params.carriers.length === 0 || params.carriers.includes(c)));
    const airline = getAirline(airlineCode);
    if (!airline) continue;

    const [minDur, maxDur] = getDurationRange(params.origin, params.destination);
    const duration = prng.nextInt(minDur, maxDur);
    const stops = domestic ? 0 : prng.nextInt(0, Math.min(2, Math.floor(duration / 180)));

    const flightNumber = generateFlightKey(prng, airlineCode, params.origin, params.destination);
    const depTime = domestic ? generateTime(prng, i) : generateInternationalTime(prng);
    const [depH, depM] = depTime.split(":").map(Number);
    const depMinutes = depH * 60 + depM;
    const arrMinutes = depMinutes + duration + prng.nextInt(0, 10);
    const arrTime = `${String(Math.floor(arrMinutes / 60) % 24).padStart(2, "0")}:${String(arrMinutes % 60).padStart(2, "0")}`;

    const aircraftCode = domestic ? prng.pick(DOMESTIC_AIRCRAFT) : prng.pick(INTERNATIONAL_AIRCRAFT);
    const aircraft = getAircraft(aircraftCode);

    // Layover stuff for multi-stop
    const layoverAirports: string[] = [];
    const layoverDurations: number[] = [];
    if (stops > 0) {
      const possibleStops = domestic ? ["CGP", "ZYL", "CXB", "DAC"].filter((a) => a !== params.origin && a !== params.destination) : ["CCU", "KUL", "SIN", "BKK", "DXB", "DOH"];
      for (let s = 0; s < stops; s++) {
        const stopAirport = prng.pick(possibleStops);
        layoverAirports.push(stopAirport);
        layoverDurations.push(prng.nextInt(45, 180));
      }
    }

    // Generate fare options
    const [minPrice, maxPrice] = getPriceBand(params.origin, params.destination);
    const fareCount = prng.nextInt(1, 4);
    const fareOpts: FareOption[] = [];

    // Time multiplier: early morning and late evening cheapest
    const hour = depH;
    let timeMultiplier = 1;
    if (hour < 8 || hour >= 19) timeMultiplier = 0.85;
    else if (hour < 10 || hour >= 17) timeMultiplier = 0.95;
    else timeMultiplier = 1.05;

    // Apply student discount
    const fareMultiplier = params.fareType === "STUDENT" ? 0.88 : 1;

    // Select fare families appropriate for cabin
    const cabinFares = fareFamilies.filter((f) => {
      if (params.cabinClass === "economy") return f.cabin === "economy";
      if (params.cabinClass === "premium_economy") return ["economy", "premium_economy"].includes(f.cabin);
      if (params.cabinClass === "business") return ["economy", "premium_economy", "business"].includes(f.cabin);
      return true;
    });

    const selectedFares = prng.subset(cabinFares, fareCount);

    for (const ff of selectedFares) {
      const baseFare = Math.round(
        (prng.nextFloat(minPrice, maxPrice) * ff.multiplier * timeMultiplier * fareMultiplier) / 100 * 100
      );
      const taxesPercent = prng.nextFloat(0.20, 0.40);
      const taxes = Math.round(baseFare * taxesPercent);
      const seatsLeft = prng.nextInt(1, 9);
      const totalFare = baseFare + taxes;

      fareOpts.push({
        id: `fare-${i}-${ff.id}`,
        fareFamilyId: ff.id,
        totalFare,
        baseFare,
        taxes,
        seatsLeft,
        rbd: ff.rbd,
      });
    }

    // Sort fare options by price
    fareOpts.sort((a, b) => a.totalFare - b.totalFare);

    // Refundable if any fare option is refundable
    const refundable = fareOpts.some((fo) => {
      const ff = getFareFamily(fo.fareFamilyId);
      return ff?.refundable === true;
    });

    // Recommended: best price-to-duration ratio
    const bestFare = fareOpts[0];
    const cheapestFlight = results.length === 0 || (bestFare && bestFare.totalFare < (results[0]?.fareOptions[0]?.totalFare ?? Infinity));
    const recommended = i === 0 && cheapestFlight;

    // Promo code on ~35% of cards
    const hasPromo = prng.chance(0.35);
    const promoCode = hasPromo ? prng.pick(promoCodes.map((p) => p.code)) : undefined;

    const minSeatsLeft = Math.min(...fareOpts.map((fo) => fo.seatsLeft));

    const segment: FlightSegment = {
      airline: airlineCode,
      flightNumber,
      origin: params.origin,
      destination: params.destination,
      departureTime: depTime,
      arrivalTime: arrTime,
      duration,
      aircraft: aircraftCode,
      aircraftName: aircraft?.name ?? "Unknown",
      stops,
      layoverAirports: stops > 0 ? layoverAirports : undefined,
      layoverDurations: stops > 0 ? layoverDurations : undefined,
    };

    results.push({
      id: `flight-${i}-${airlineCode}-${flightNumber}`,
      segments: [segment],
      fareOptions: fareOpts,
      totalDuration: duration,
      refundable,
      recommended,
      promoCode,
      seatsLeft: minSeatsLeft,
    });
  }

  // Sort by cheapest fare
  results.sort((a, b) => (a.fareOptions[0]?.totalFare ?? 0) - (b.fareOptions[0]?.totalFare ?? 0));

  return results;
}

export function generateRoundTripResults(
  outbound: SearchParams,
  inbound: SearchParams
): { outbound: FlightResult[]; inbound: FlightResult[]; combos: { outboundIdx: number; inboundIdx: number; totalFare: number }[] } {
  const outboundResults = searchFlights(outbound);
  const inboundResults = searchFlights(inbound);
  const comboPrng = new SeededPRNG(`${outbound.origin}-${outbound.destination}-${outbound.date}-${inbound.date}-combo`);

  // Generate some combos (mix of same carrier and different carriers)
  const combos: { outboundIdx: number; inboundIdx: number; totalFare: number }[] = [];

  const numCombos = Math.min(outboundResults.length, inboundResults.length, comboPrng.nextInt(2, 8));

  for (let i = 0; i < numCombos; i++) {
    const oIdx = i % outboundResults.length;
    const iIdx = i % inboundResults.length;
    const outFare = outboundResults[oIdx]?.fareOptions[0]?.totalFare ?? 5000;
    const inFare = inboundResults[iIdx]?.fareOptions[0]?.totalFare ?? 5000;
    combos.push({
      outboundIdx: oIdx,
      inboundIdx: iIdx,
      totalFare: outFare + inFare,
    });
  }

  return { outbound: outboundResults, inbound: inboundResults, combos };
}

export function generateFareCalendar(
  origin: string,
  destination: string,
  startDate: string,
  days: number = 7
): { date: string; minFare: number; minFlightId?: string }[] {
  const results: { date: string; minFare: number }[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    const flights = searchFlights({
      origin,
      destination,
      date: dateStr,
      tripType: "O",
      adult: 1,
      child: 0,
      kid: 0,
      infant: 0,
      cabinClass: "economy",
      fareType: "REGULAR",
    });
    const minFare = flights.length > 0 ? (flights[0]?.fareOptions[0]?.totalFare ?? 0) : 0;
    results.push({ date: dateStr, minFare });
  }
  return results;
}
