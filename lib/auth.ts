import { db, users, organizations } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(
  email: string,
  fullName: string,
  role: "enduser" | "agency" | "partner" | "superadmin" = "enduser",
  password?: string,
  phone?: string
) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("User already exists");
  }

  // If role is agency/partner, create organization
  let orgId: string | undefined = undefined;
  if (role !== "enduser" && role !== "superadmin") {
    const org = await db
      .insert(organizations)
      .values({
        name: fullName,
        type: role === "agency" ? "agency" : "partner",
        country: "BD",
        currency: "BDT",
        tier: "free",
      })
      .returning({ id: organizations.id });

    orgId = org[0].id;
  }

  const passwordHash = password ? await hashPassword(password) : undefined;

  const user = await db
    .insert(users)
    .values({
      email,
      fullName,
      phone,
      passwordHash,
      role,
      orgId,
      status: "active",
      verifiedAt: new Date(),
    })
    .returning();

  return user[0];
}

export async function getUserByEmail(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user[0] || null;
}

export async function getUserById(id: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user[0] || null;
}
