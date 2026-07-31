import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Self-service registration.
 *
 * `superadmin` is deliberately not an option: platform operators are
 * provisioned out of band, never by an anonymous caller.
 */
const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  fullName: z.string().trim().min(2).max(255),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(["enduser", "agency", "partner"]).default("enduser"),
});

const SIGNUPS_PER_HOUR = 10;

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "register"), SIGNUPS_PER_HOUR, 3_600_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid registration details",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { email, fullName, password, phone, role } = parsed.data;

  try {
    const user = await createUser(email, fullName, role, password, phone);

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    // Duplicate-email is reported plainly: the login page already reveals
    // whether an address is registered, so hiding it here buys nothing.
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Could not create the account" },
      { status: 500 }
    );
  }
}
