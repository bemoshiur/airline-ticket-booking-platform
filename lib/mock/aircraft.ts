export interface AircraftType {
  code: string;
  name: string;
  manufacturer: string;
  seatLayout: string; // e.g., "3-3", "2-2"
  totalRows: number;
  totalSeats: number;
  hasWings: boolean;
}

export const aircraftTypes: AircraftType[] = [
  {
    code: "ATR72",
    name: "ATR 72-600",
    manufacturer: "ATR",
    seatLayout: "2-2",
    totalRows: 18,
    totalSeats: 72,
    hasWings: true,
  },
  {
    code: "B738",
    name: "Boeing 737-800",
    manufacturer: "Boeing",
    seatLayout: "3-3",
    totalRows: 30,
    totalSeats: 180,
    hasWings: true,
  },
  {
    code: "DH8D",
    name: "DHC8 Dash 8",
    manufacturer: "De Havilland Canada",
    seatLayout: "2-2",
    totalRows: 19,
    totalSeats: 76,
    hasWings: true,
  },
  {
    code: "B789",
    name: "Boeing 787-9 Dreamliner",
    manufacturer: "Boeing",
    seatLayout: "3-3-3",
    totalRows: 42,
    totalSeats: 294,
    hasWings: true,
  },
  {
    code: "A320",
    name: "Airbus A320",
    manufacturer: "Airbus",
    seatLayout: "3-3",
    totalRows: 29,
    totalSeats: 174,
    hasWings: true,
  },
  {
    code: "A350",
    name: "Airbus A350-900",
    manufacturer: "Airbus",
    seatLayout: "3-3-3",
    totalRows: 40,
    totalSeats: 300,
    hasWings: true,
  },
  {
    code: "B773",
    name: "Boeing 777-300ER",
    manufacturer: "Boeing",
    seatLayout: "3-3-3",
    totalRows: 50,
    totalSeats: 368,
    hasWings: true,
  },
];

export const aircraftMap = new Map<string, AircraftType>();
aircraftTypes.forEach((a) => aircraftMap.set(a.code, a));

export function getAircraft(code: string): AircraftType | undefined {
  return aircraftMap.get(code);
}
