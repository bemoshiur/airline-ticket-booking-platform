export const BANGLADESH_PHONE_REGEX = /^(\+?880|0)1[3-9]\d{8}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSPORT_REGEX = /^[A-Z]{1,2}[0-9]{6,8}$/;
export const CARD_NUMBER_REGEX = /^\d{16}$/;
export const CVV_REGEX = /^\d{3,4}$/;

export function validateAge(dob: Date, travelDate: Date): number {
  const diff = travelDate.getTime() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function getPaxType(age: number): "adult" | "child" | "kid" | "infant" {
  if (age >= 12) return "adult";
  if (age >= 5) return "child";
  if (age >= 2) return "kid";
  return "infant";
}

export function validatePaxAgeBand(
  dob: Date,
  travelDate: Date,
  expectedBand: "adult" | "child" | "kid" | "infant"
): { valid: boolean; message?: string } {
  const age = validateAge(dob, travelDate);
  const actual = getPaxType(age);

  const bandLabels: Record<string, string> = {
    adult: "Adult (>12 years)",
    child: "Child (5-12 years)",
    kid: "Kid (2-5 years)",
    infant: "Infant (<2 years)",
  };

  if (actual !== expectedBand) {
    return {
      valid: false,
      message: `Age must be between ${getBandRange(expectedBand)} on the date of travel. Current age: ${age} years. Expected: ${bandLabels[expectedBand]}`,
    };
  }

  return { valid: true };
}

function getBandRange(band: string): string {
  const ranges: Record<string, string> = {
    adult: "12+ years",
    child: "5 and 12 years",
    kid: "2 and 5 years",
    infant: "0 and 2 years",
  };
  return ranges[band] || "";
}

export const NATIONALITIES = [
  "Bangladeshi", "Indian", "Pakistani", "Nepalese", "Sri Lankan", "Maldivian",
  "Bhutanese", "Afghan", "Myanmarese", "Chinese", "Japanese", "South Korean",
  "Thai", "Vietnamese", "Malaysian", "Singaporean", "Indonesian", "Filipino",
  "British", "American", "Canadian", "Australian", "German", "French",
  "Italian", "Spanish", "Dutch", "Swiss", "Swedish", "Norwegian", "Danish",
  "Finnish", "Russian", "Turkish", "Emirati", "Saudi", "Qatari", "Kuwaiti",
  "Omani", "Bahraini", "Egyptian", "Jordanian", "Lebanese", "South African",
  "Nigerian", "Kenyan", "Ethiopian", "Brazilian", "Mexican", "Argentinian",
];

export const TITLES = {
  adult: ["Mr.", "Mrs.", "Ms."],
  child: ["Mstr.", "Miss"],
  kid: ["Mstr.", "Miss"],
  infant: ["Mstr.", "Miss"],
};
