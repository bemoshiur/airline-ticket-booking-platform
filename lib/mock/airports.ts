export interface Airport {
  code: string;
  city: string;
  cityBn: string;
  name: string;
  country: string;
  countryCode: string;
  tz: string;
  popular: number; // higher = more popular
  domestic: boolean;
}

export const airports: Airport[] = [
  // Bangladesh Domestic
  { code: "DAC", city: "Dhaka", cityBn: "ঢাকা", name: "Hazrat Shahjalal International Airport", country: "Bangladesh", countryCode: "BD", tz: "Asia/Dhaka", popular: 100, domestic: true },
  { code: "CGP", city: "Chattogram", cityBn: "চট্টগ্রাম", name: "Shah Amanat International Airport", country: "Bangladesh", countryCode: "BD", tz: "Asia/Dhaka", popular: 80, domestic: true },
  { code: "CXB", city: "Cox's Bazar", cityBn: "কক্সবাজার", name: "Cox's Bazar Airport", country: "Bangladesh", countryCode: "BD", tz: "Asia/Dhaka", popular: 70, domestic: true },
  { code: "ZYL", city: "Sylhet", cityBn: "সিলেট", name: "Osmani International Airport", country: "Bangladesh", countryCode: "BD", tz: "Asia/Dhaka", popular: 65, domestic: true },
  { code: "SPD", city: "Saidpur", cityBn: "সৈয়দপুর", name: "Saidpur Airport", country: "Bangladesh", countryCode: "BD", tz: "Asia/Dhaka", popular: 40, domestic: true },
  { code: "RJH", city: "Rajshahi", cityBn: "রাজশাহী", name: "Shah Makhdum Airport", country: "Bangladesh", countryCode: "BD", tz: "Asia/Dhaka", popular: 35, domestic: true },
  { code: "BZL", city: "Barishal", cityBn: "বরিশাল", name: "Barishal Airport", country: "Bangladesh", countryCode: "BD", tz: "Asia/Dhaka", popular: 30, domestic: true },
  { code: "JSR", city: "Jashore", cityBn: "যশোর", name: "Jashore Airport", country: "Bangladesh", countryCode: "BD", tz: "Asia/Dhaka", popular: 25, domestic: true },
  // India
  { code: "CCU", city: "Kolkata", cityBn: "কলকাতা", name: "Netaji Subhas Chandra Bose International Airport", country: "India", countryCode: "IN", tz: "Asia/Kolkata", popular: 75, domestic: false },
  { code: "DEL", city: "Delhi", cityBn: "দিল্লি", name: "Indira Gandhi International Airport", country: "India", countryCode: "IN", tz: "Asia/Kolkata", popular: 70, domestic: false },
  { code: "BOM", city: "Mumbai", cityBn: "মুম্বাই", name: "Chhatrapati Shivaji Maharaj International Airport", country: "India", countryCode: "IN", tz: "Asia/Kolkata", popular: 65, domestic: false },
  { code: "MAA", city: "Chennai", cityBn: "চেন্নাই", name: "Chennai International Airport", country: "India", countryCode: "IN", tz: "Asia/Kolkata", popular: 50, domestic: false },
  { code: "BLR", city: "Bengaluru", cityBn: "বেঙ্গালুরু", name: "Kempegowda International Airport", country: "India", countryCode: "IN", tz: "Asia/Kolkata", popular: 55, domestic: false },
  // Middle East
  { code: "DXB", city: "Dubai", cityBn: "দুবাই", name: "Dubai International Airport", country: "UAE", countryCode: "AE", tz: "Asia/Dubai", popular: 90, domestic: false },
  { code: "AUH", city: "Abu Dhabi", cityBn: "আবুধাবি", name: "Abu Dhabi International Airport", country: "UAE", countryCode: "AE", tz: "Asia/Dubai", popular: 60, domestic: false },
  { code: "DOH", city: "Doha", cityBn: "দোহা", name: "Hamad International Airport", country: "Qatar", countryCode: "QA", tz: "Asia/Qatar", popular: 75, domestic: false },
  { code: "JED", city: "Jeddah", cityBn: "জেদ্দা", name: "King Abdulaziz International Airport", country: "Saudi Arabia", countryCode: "SA", tz: "Asia/Riyadh", popular: 85, domestic: false },
  { code: "RUH", city: "Riyadh", cityBn: "রিয়াদ", name: "King Khalid International Airport", country: "Saudi Arabia", countryCode: "SA", tz: "Asia/Riyadh", popular: 55, domestic: false },
  { code: "DMM", city: "Dammam", cityBn: "দাম্মাম", name: "King Fahd International Airport", country: "Saudi Arabia", countryCode: "SA", tz: "Asia/Riyadh", popular: 40, domestic: false },
  { code: "MCT", city: "Muscat", cityBn: "মাস্কাট", name: "Muscat International Airport", country: "Oman", countryCode: "OM", tz: "Asia/Muscat", popular: 35, domestic: false },
  { code: "BAH", city: "Manama", cityBn: "মানামা", name: "Bahrain International Airport", country: "Bahrain", countryCode: "BH", tz: "Asia/Bahrain", popular: 30, domestic: false },
  { code: "KWI", city: "Kuwait City", cityBn: "কুয়েত সিটি", name: "Kuwait International Airport", country: "Kuwait", countryCode: "KW", tz: "Asia/Kuwait", popular: 45, domestic: false },
  // Southeast Asia
  { code: "BKK", city: "Bangkok", cityBn: "ব্যাংকক", name: "Suvarnabhumi Airport", country: "Thailand", countryCode: "TH", tz: "Asia/Bangkok", popular: 80, domestic: false },
  { code: "KUL", city: "Kuala Lumpur", cityBn: "কুয়ালালামপুর", name: "Kuala Lumpur International Airport", country: "Malaysia", countryCode: "MY", tz: "Asia/Kuala_Lumpur", popular: 75, domestic: false },
  { code: "SIN", city: "Singapore", cityBn: "সিঙ্গাপুর", name: "Singapore Changi Airport", country: "Singapore", countryCode: "SG", tz: "Asia/Singapore", popular: 85, domestic: false },
  { code: "HKT", city: "Phuket", cityBn: "ফুকেট", name: "Phuket International Airport", country: "Thailand", countryCode: "TH", tz: "Asia/Bangkok", popular: 40, domestic: false },
  { code: "CNX", city: "Chiang Mai", cityBn: "চিয়াং মাই", name: "Chiang Mai International Airport", country: "Thailand", countryCode: "TH", tz: "Asia/Bangkok", popular: 25, domestic: false },
  // South Asia
  { code: "KTM", city: "Kathmandu", cityBn: "কাঠমান্ডু", name: "Tribhuvan International Airport", country: "Nepal", countryCode: "NP", tz: "Asia/Kathmandu", popular: 60, domestic: false },
  { code: "MLE", city: "Malé", cityBn: "মালে", name: "Velana International Airport", country: "Maldives", countryCode: "MV", tz: "Indian/Maldives", popular: 55, domestic: false },
  { code: "CMB", city: "Colombo", cityBn: "কলম্বো", name: "Bandaranaike International Airport", country: "Sri Lanka", countryCode: "LK", tz: "Asia/Colombo", popular: 50, domestic: false },
  // East Asia
  { code: "HKG", city: "Hong Kong", cityBn: "হংকং", name: "Hong Kong International Airport", country: "Hong Kong", countryCode: "HK", tz: "Asia/Hong_Kong", popular: 70, domestic: false },
  { code: "CAN", city: "Guangzhou", cityBn: "গুয়াংঝু", name: "Guangzhou Baiyun International Airport", country: "China", countryCode: "CN", tz: "Asia/Shanghai", popular: 50, domestic: false },
  { code: "PVG", city: "Shanghai", cityBn: "সাংহাই", name: "Shanghai Pudong International Airport", country: "China", countryCode: "CN", tz: "Asia/Shanghai", popular: 55, domestic: false },
  { code: "NRT", city: "Tokyo", cityBn: "টোকিও", name: "Narita International Airport", country: "Japan", countryCode: "JP", tz: "Asia/Tokyo", popular: 60, domestic: false },
  { code: "ICN", city: "Seoul", cityBn: "সিউল", name: "Incheon International Airport", country: "South Korea", countryCode: "KR", tz: "Asia/Seoul", popular: 50, domestic: false },
  { code: "KIX", city: "Osaka", cityBn: "ওসাকা", name: "Kansai International Airport", country: "Japan", countryCode: "JP", tz: "Asia/Tokyo", popular: 35, domestic: false },
  // Europe
  { code: "LHR", city: "London", cityBn: "লন্ডন", name: "Heathrow Airport", country: "United Kingdom", countryCode: "GB", tz: "Europe/London", popular: 75, domestic: false },
  { code: "MAN", city: "Manchester", cityBn: "ম্যানচেস্টার", name: "Manchester Airport", country: "United Kingdom", countryCode: "GB", tz: "Europe/London", popular: 40, domestic: false },
  { code: "IST", city: "Istanbul", cityBn: "ইস্তাম্বুল", name: "Istanbul Airport", country: "Turkey", countryCode: "TR", tz: "Europe/Istanbul", popular: 80, domestic: false },
  { code: "SAW", city: "Istanbul SAW", cityBn: "ইস্তাম্বুল সাবিহা", name: "Sabiha Gökçen International Airport", country: "Turkey", countryCode: "TR", tz: "Europe/Istanbul", popular: 30, domestic: false },
  { code: "FRA", city: "Frankfurt", cityBn: "ফ্রাংকফুর্ট", name: "Frankfurt Airport", country: "Germany", countryCode: "DE", tz: "Europe/Berlin", popular: 55, domestic: false },
  { code: "CDG", city: "Paris", cityBn: "প্যারিস", name: "Charles de Gaulle Airport", country: "France", countryCode: "FR", tz: "Europe/Paris", popular: 50, domestic: false },
  { code: "AMS", city: "Amsterdam", cityBn: "আমস্টারডাম", name: "Amsterdam Airport Schiphol", country: "Netherlands", countryCode: "NL", tz: "Europe/Amsterdam", popular: 40, domestic: false },
  // North America
  { code: "JFK", city: "New York", cityBn: "নিউ ইয়র্ক", name: "John F. Kennedy International Airport", country: "United States", countryCode: "US", tz: "America/New_York", popular: 65, domestic: false },
  { code: "YYZ", city: "Toronto", cityBn: "টরন্টো", name: "Toronto Pearson International Airport", country: "Canada", countryCode: "CA", tz: "America/Toronto", popular: 55, domestic: false },
  { code: "YVR", city: "Vancouver", cityBn: "ভ্যানকুভার", name: "Vancouver International Airport", country: "Canada", countryCode: "CA", tz: "America/Vancouver", popular: 40, domestic: false },
  // Australia / Oceania
  { code: "MEL", city: "Melbourne", cityBn: "মেলবোর্ন", name: "Melbourne Airport", country: "Australia", countryCode: "AU", tz: "Australia/Melbourne", popular: 45, domestic: false },
  { code: "SYD", city: "Sydney", cityBn: "সিডনি", name: "Sydney Kingsford Smith Airport", country: "Australia", countryCode: "AU", tz: "Australia/Sydney", popular: 50, domestic: false },
  // Africa
  { code: "CAI", city: "Cairo", cityBn: "কায়রো", name: "Cairo International Airport", country: "Egypt", countryCode: "EG", tz: "Africa/Cairo", popular: 30, domestic: false },
  { code: "ADD", city: "Addis Ababa", cityBn: "আদিস আবাবা", name: "Bole International Airport", country: "Ethiopia", countryCode: "ET", tz: "Africa/Addis_Ababa", popular: 25, domestic: false },
  // Additional popular & connecting
  { code: "PEW", city: "Peshawar", cityBn: "পেশাওয়ার", name: "Bacha Khan International Airport", country: "Pakistan", countryCode: "PK", tz: "Asia/Karachi", popular: 20, domestic: false },
  { code: "LHE", city: "Lahore", cityBn: "লাহোর", name: "Allama Iqbal International Airport", country: "Pakistan", countryCode: "PK", tz: "Asia/Karachi", popular: 30, domestic: false },
  { code: "KHI", city: "Karachi", cityBn: "করাচি", name: "Jinnah International Airport", country: "Pakistan", countryCode: "PK", tz: "Asia/Karachi", popular: 35, domestic: false },
  { code: "RGN", city: "Yangon", cityBn: "ইয়াঙ্গুন", name: "Yangon International Airport", country: "Myanmar", countryCode: "MM", tz: "Asia/Yangon", popular: 20, domestic: false },
  { code: "PNH", city: "Phnom Penh", cityBn: "পনম পেন", name: "Phnom Penh International Airport", country: "Cambodia", countryCode: "KH", tz: "Asia/Phnom_Penh", popular: 15, domestic: false },
  { code: "RGN", city: "Yangon", cityBn: "ইয়াঙ্গুন", name: "Yangon International Airport", country: "Myanmar", countryCode: "MM", tz: "Asia/Yangon", popular: 20, domestic: false },
  { code: "PNH", city: "Phnom Penh", cityBn: "পনম পেন", name: "Phnom Penh International Airport", country: "Cambodia", countryCode: "KH", tz: "Asia/Phnom_Penh", popular: 15, domestic: false },
];

// Deduplicate by code
const seen = new Set<string>();
export const airportMap = new Map<string, Airport>();
airports.forEach((a) => {
  if (!seen.has(a.code)) {
    seen.add(a.code);
    airportMap.set(a.code, a);
  }
});

export const domesticAirports = airports.filter((a) => a.domestic);
export const internationalAirports = airports.filter((a) => !a.domestic);

export function getAirport(code: string): Airport | undefined {
  return airportMap.get(code);
}

export function searchAirports(query: string): Airport[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const all = Array.from(airportMap.values());
  return all
    .filter((a) => {
      const code = a.code.toLowerCase();
      const city = a.city.toLowerCase();
      const name = a.name.toLowerCase();
      const cityBn = a.cityBn.toLowerCase();
      const country = a.country.toLowerCase();
      const misspellings = getMisspellings(a);
      return (
        code.startsWith(q) ||
        code === q ||
        city.includes(q) ||
        name.includes(q) ||
        cityBn.includes(q) ||
        country.includes(q) ||
        misspellings.some((m) => m.includes(q))
      );
    })
    .sort((a, b) => b.popular - a.popular);
}

export function getPopularAirports(excludeCode?: string, limit = 8): Airport[] {
  return Array.from(airportMap.values())
    .sort((a, b) => b.popular - a.popular)
    .filter((a) => a.code !== excludeCode)
    .slice(0, limit);
}

function getMisspellings(airport: Airport): string[] {
  const map: Record<string, string[]> = {
    DAC: ["dacca", "dhaka", "dahka"],
    CGP: ["chittagong", "chattogram"],
    CXB: ["coxs", "coxes"],
    ZYL: ["sylhet", "silhet"],
    CCU: ["calcutta", "kolkota"],
    BOM: ["bombay"],
    MAA: ["madras"],
  };
  return map[airport.code] ?? [];
}
