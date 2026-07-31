import { db, airlines, airports, flights } from "@/lib/db";

const AIRLINES_DATA = [
  {
    iataCode: "BA",
    name: "British Airways",
    country: "United Kingdom",
    alliance: "OneWorld",
  },
  { iataCode: "EK", name: "Emirates", country: "UAE", alliance: "None" },
  { iataCode: "QR", name: "Qatar Airways", country: "Qatar", alliance: "OneWorld" },
  { iataCode: "SQ", name: "Singapore Airlines", country: "Singapore", alliance: "Star Alliance" },
  { iataCode: "AK", name: "Air Asia", country: "Malaysia", alliance: "None" },
  { iataCode: "TG", name: "Thai Airways", country: "Thailand", alliance: "Star Alliance" },
  { iataCode: "NH", name: "ANA (All Nippon Airways)", country: "Japan", alliance: "Star Alliance" },
  { iataCode: "CX", name: "Cathay Pacific", country: "Hong Kong", alliance: "OneWorld" },
  { iataCode: "AF", name: "Air France", country: "France", alliance: "SkyTeam" },
  { iataCode: "LH", name: "Lufthansa", country: "Germany", alliance: "Star Alliance" },
  { iataCode: "KL", name: "KLM", country: "Netherlands", alliance: "SkyTeam" },
  { iataCode: "UA", name: "United Airlines", country: "United States", alliance: "Star Alliance" },
  { iataCode: "AA", name: "American Airlines", country: "United States", alliance: "OneWorld" },
  { iataCode: "DL", name: "Delta Air Lines", country: "United States", alliance: "SkyTeam" },
];

const AIRPORTS_DATA = [
  // Bangladesh
  { iataCode: "DAC", icaoCode: "VGHS", city: "Dhaka", cityBn: "ঢাকা", country: "Bangladesh", countryCode: "BD", timezone: "Asia/Dhaka", domestic: true, popular: 100 },
  { iataCode: "CGP", icaoCode: "VGCO", city: "Chattogram", cityBn: "চট্টগ্রাম", country: "Bangladesh", countryCode: "BD", timezone: "Asia/Dhaka", domestic: true, popular: 80 },
  { iataCode: "ZYL", icaoCode: "VGSJ", city: "Sylhet", cityBn: "সিলেট", country: "Bangladesh", countryCode: "BD", timezone: "Asia/Dhaka", domestic: true, popular: 65 },
  { iataCode: "CXB", icaoCode: "VGCB", city: "Cox's Bazar", cityBn: "কক্সবাজার", country: "Bangladesh", countryCode: "BD", timezone: "Asia/Dhaka", domestic: true, popular: 70 },

  // Middle East
  { iataCode: "DXB", icaoCode: "OMDB", city: "Dubai", cityBn: "দুবাই", country: "UAE", countryCode: "AE", timezone: "Asia/Dubai", domestic: false, popular: 90 },
  { iataCode: "DXB", icaoCode: "OMDB", city: "Dubai", cityBn: "দুবাই", country: "UAE", countryCode: "AE", timezone: "Asia/Dubai", domestic: false, popular: 90 },
  { iataCode: "DOH", icaoCode: "OTHH", city: "Doha", cityBn: "দোহা", country: "Qatar", countryCode: "QA", timezone: "Asia/Qatar", domestic: false, popular: 75 },
  { iataCode: "JED", icaoCode: "OEJN", city: "Jeddah", cityBn: "জেদ্দা", country: "Saudi Arabia", countryCode: "SA", timezone: "Asia/Riyadh", domestic: false, popular: 85 },

  // Southeast Asia
  { iataCode: "BKK", icaoCode: "VTBS", city: "Bangkok", cityBn: "ব্যাংকক", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", domestic: false, popular: 80 },
  { iataCode: "KUL", icaoCode: "WMKK", city: "Kuala Lumpur", cityBn: "কুয়ালালামপুর", country: "Malaysia", countryCode: "MY", timezone: "Asia/Kuala_Lumpur", domestic: false, popular: 75 },
  { iataCode: "SIN", icaoCode: "WSSS", city: "Singapore", cityBn: "সিঙ্গাপুর", country: "Singapore", countryCode: "SG", timezone: "Asia/Singapore", domestic: false, popular: 85 },
  { iataCode: "HKG", icaoCode: "VHHH", city: "Hong Kong", cityBn: "হংকং", country: "Hong Kong", countryCode: "HK", timezone: "Asia/Hong_Kong", domestic: false, popular: 70 },
];

async function seed() {
  try {
    console.log("Seeding airlines...");
    for (const airline of AIRLINES_DATA) {
      try {
        await db.insert(airlines).values(airline);
        console.log(`✓ Inserted ${airline.name}`);
      } catch (e) {
        console.log(`⊘ Skipped ${airline.name} (likely exists)`);
      }
    }

    console.log("Seeding airports...");
    for (const airport of AIRPORTS_DATA) {
      try {
        await db.insert(airports).values(airport);
        console.log(`✓ Inserted ${airport.city}`);
      } catch (e) {
        console.log(`⊘ Skipped ${airport.city} (likely exists)`);
      }
    }

    console.log("Seeding flights...");

    // Get airline and airport IDs for flight creation
    const ekAirline = await db.select().from(airlines).where(eq(airlines.iataCode, "EK")).limit(1);
    const qrAirline = await db.select().from(airlines).where(eq(airlines.iataCode, "QR")).limit(1);
    const sqAirline = await db.select().from(airlines).where(eq(airlines.iataCode, "SQ")).limit(1);
    const tgAirline = await db.select().from(airlines).where(eq(airlines.iataCode, "TG")).limit(1);

    const dacAirport = await db.select().from(airports).where(eq(airports.iataCode, "DAC")).limit(1);
    const dxbAirport = await db.select().from(airports).where(eq(airports.iataCode, "DXB")).limit(1);
    const kulAirport = await db.select().from(airports).where(eq(airports.iataCode, "KUL")).limit(1);
    const bkkAirport = await db.select().from(airports).where(eq(airports.iataCode, "BKK")).limit(1);

    if (!ekAirline[0] || !dacAirport[0]) {
      console.warn("⚠ Airlines or airports not found, skipping flights");
      process.exit(1);
    }

    // Create sample flights
    const sampleFlights = [
      // DAC to DXB
      {
        airlineId: ekAirline[0].id,
        flightNumber: "EK570",
        departureAirportId: dacAirport[0].id,
        arrivalAirportId: dxbAirport[0].id,
        departureTime: new Date(Date.now() + 86400000), // Tomorrow 10:00
        arrivalTime: new Date(Date.now() + 86400000 + 14400000), // Tomorrow 14:00
        durationMinutes: 240,
        aircraftType: "Boeing 777",
        stops: 0,
        basePrice: 85000, // 850 BDT
        seatsAvailable: 250,
        seatsEconomy: 200,
        seatsBusiness: 30,
        seatsFirst: 20,
      },
      {
        airlineId: qrAirline[0].id,
        flightNumber: "QR627",
        departureAirportId: dacAirport[0].id,
        arrivalAirportId: dxbAirport[0].id,
        departureTime: new Date(Date.now() + 86400000 + 3600000), // Tomorrow 11:00
        arrivalTime: new Date(Date.now() + 86400000 + 18000000), // Tomorrow 15:00
        durationMinutes: 240,
        aircraftType: "Airbus A380",
        stops: 0,
        basePrice: 82000,
        seatsAvailable: 300,
        seatsEconomy: 250,
        seatsBusiness: 35,
        seatsFirst: 15,
      },
      // DAC to KUL
      {
        airlineId: sqAirline[0].id,
        flightNumber: "SQ403",
        departureAirportId: dacAirport[0].id,
        arrivalAirportId: kulAirport[0].id,
        departureTime: new Date(Date.now() + 86400000 + 7200000), // Tomorrow 12:00
        arrivalTime: new Date(Date.now() + 86400000 + 28800000), // Tomorrow 20:00
        durationMinutes: 360,
        aircraftType: "Airbus A350",
        stops: 0,
        basePrice: 75000,
        seatsAvailable: 280,
        seatsEconomy: 230,
        seatsBusiness: 35,
        seatsFirst: 15,
      },
      // DAC to BKK
      {
        airlineId: tgAirline[0].id,
        flightNumber: "TG312",
        departureAirportId: dacAirport[0].id,
        arrivalAirportId: bkkAirport[0].id,
        departureTime: new Date(Date.now() + 86400000 + 10800000), // Tomorrow 13:00
        arrivalTime: new Date(Date.now() + 86400000 + 32400000), // Tomorrow 21:00
        durationMinutes: 360,
        aircraftType: "Boeing 787",
        stops: 1,
        basePrice: 68000,
        seatsAvailable: 260,
        seatsEconomy: 210,
        seatsBusiness: 35,
        seatsFirst: 15,
      },
    ];

    for (const flight of sampleFlights) {
      try {
        await db.insert(flights).values(flight);
        console.log(`✓ Created flight ${flight.flightNumber}`);
      } catch (e) {
        console.log(`⊘ Skipped flight ${flight.flightNumber}`);
      }
    }

    console.log("✓ Seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

import { eq } from "drizzle-orm";

seed();
