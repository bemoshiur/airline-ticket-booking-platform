export interface Airline {
  code: string;
  name: string;
  country: string;
  logo: string; // placeholder initials
  color: string;
  alliance?: string;
}

export const airlines: Airline[] = [
  { code: "BS", name: "US-Bangla Airlines", country: "Bangladesh", logo: "US", color: "#E11B22" },
  { code: "BG", name: "Biman Bangladesh Airlines", country: "Bangladesh", logo: "BG", color: "#006747" },
  { code: "2A", name: "Air Astra", country: "Bangladesh", logo: "AA", color: "#F47920" },
  { code: "VQ", name: "Novo Air", country: "Bangladesh", logo: "NV", color: "#1B75BC" },
  { code: "EK", name: "Emirates", country: "UAE", logo: "EK", color: "#D71921" },
  { code: "QR", name: "Qatar Airways", country: "Qatar", logo: "QR", color: "#8A1538" },
  { code: "SQ", name: "Singapore Airlines", country: "Singapore", logo: "SQ", color: "#F0AB00" },
  { code: "MH", name: "Malaysia Airlines", country: "Malaysia", logo: "MH", color: "#003D7A" },
  { code: "TK", name: "Turkish Airlines", country: "Turkey", logo: "TK", color: "#E30A17" },
  { code: "AI", name: "Air India", country: "India", logo: "AI", color: "#D90027" },
  { code: "6E", name: "IndiGo", country: "India", logo: "6E", color: "#1C5DA9" },
  { code: "UL", name: "SriLankan Airlines", country: "Sri Lanka", logo: "UL", color: "#670A35" },
  { code: "CX", name: "Cathay Pacific", country: "Hong Kong", logo: "CX", color: "#006747" },
  { code: "G9", name: "Air Arabia", country: "UAE", logo: "G9", color: "#E31E24" },
  { code: "CZ", name: "China Southern Airlines", country: "China", logo: "CZ", color: "#1C5DA9" },
  { code: "EY", name: "Etihad Airways", country: "UAE", logo: "EY", color: "#B4975A" },
  { code: "GF", name: "Gulf Air", country: "Bahrain", logo: "GF", color: "#E11B22" },
  { code: "W5", name: "Iran Air", country: "Iran", logo: "IR", color: "#1C5DA9" },
  { code: "SV", name: "Saudia", country: "Saudi Arabia", logo: "SV", color: "#006341" },
  { code: "TG", name: "Thai Airways", country: "Thailand", logo: "TG", color: "#542D7B" },
];

export const airlineMap = new Map<string, Airline>();
airlines.forEach((a) => airlineMap.set(a.code, a));

export function getAirline(code: string): Airline | undefined {
  return airlineMap.get(code);
}

export const domesticAirlines = airlines.filter((a) =>
  ["BS", "BG", "2A", "VQ"].includes(a.code)
);
