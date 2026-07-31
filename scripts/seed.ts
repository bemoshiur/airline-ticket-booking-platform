import { db, airlines, airports } from "@/lib/db";

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
    // Delete existing to avoid duplicates
    // await db.delete(airlines); // Be careful with this

    for (const airline of AIRLINES_DATA) {
      try {
        await db.insert(airlines).values(airline);
        console.log(`✓ Inserted ${airline.name}`);
      } catch (e) {
        // Likely duplicate, skip
        console.log(`⊘ Skipped ${airline.name} (likely exists)`);
      }
    }

    console.log("Seeding airports...");
    for (const airport of AIRPORTS_DATA) {
      try {
        await db.insert(airports).values(airport);
        console.log(`✓ Inserted ${airport.city}`);
      } catch (e) {
        // Likely duplicate, skip
        console.log(`⊘ Skipped ${airport.city} (likely exists)`);
      }
    }

    console.log("✓ Seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
