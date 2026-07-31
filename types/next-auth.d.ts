import type { DefaultSession } from "next-auth";

/**
 * Every RBAC check in the API reads `session.user.role` and `session.user.orgId`.
 * Declare them here so the compiler enforces that the jwt/session callbacks in
 * `lib/auth-config.ts` keep populating them.
 */

export type AppUserRole = "enduser" | "agency" | "partner" | "superadmin";

declare module "next-auth" {
  interface User {
    role: AppUserRole;
    orgId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppUserRole;
      orgId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppUserRole;
    orgId: string | null;
  }
}
