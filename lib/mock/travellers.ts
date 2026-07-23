export interface SavedTraveller {
  id: string;
  title: string;
  firstName: string;
  surname: string;
  dob: string; // YYYY-MM-DD
  nationality: string;
  gender: "Male" | "Female";
  passportNumber?: string;
  passportExpiry?: string;
  frequentFlyerProgram?: string;
  frequentFlyerNumber?: string;
  phone: string;
  email: string;
}

export const savedTravellers: SavedTraveller[] = [
  {
    id: "trav-1",
    title: "Mr.",
    firstName: "S M Moshiur",
    surname: "Rahman",
    dob: "1990-05-15",
    nationality: "Bangladeshi",
    gender: "Male",
    passportNumber: "BP1234567",
    passportExpiry: "2028-06-20",
    phone: "+8801712345678",
    email: "moshiur@example.com",
  },
  {
    id: "trav-2",
    title: "Mrs.",
    firstName: "Nusrat",
    surname: "Jahan",
    dob: "1993-08-22",
    nationality: "Bangladeshi",
    gender: "Female",
    phone: "+8801712345679",
    email: "nusrat@example.com",
  },
  {
    id: "trav-3",
    title: "Mr.",
    firstName: "Tanvir",
    surname: "Hossain",
    dob: "1988-12-03",
    nationality: "Bangladeshi",
    gender: "Male",
    passportNumber: "BP7654321",
    passportExpiry: "2027-11-15",
    phone: "+8801712345680",
    email: "tanvir@example.com",
  },
];
