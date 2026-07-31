import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "./auth";
import type { AppUserRole } from "@/types/next-auth";

const APP_ROLES: readonly AppUserRole[] = [
  "enduser",
  "agency",
  "partner",
  "superadmin",
];

/**
 * An unrecognised role degrades to `enduser` — the least privileged role — so a
 * malformed token can never widen access.
 */
function toAppRole(value: unknown): AppUserRole {
  return APP_ROLES.includes(value as AppUserRole)
    ? (value as AppUserRole)
    : "enduser";
}

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  // Credentials sign-in requires the JWT strategy — there is no adapter here.
  session: { strategy: "jwt" },
  callbacks: {
    /**
     * `authorize` returns role and orgId, but NextAuth only forwards the
     * default User fields unless we copy them onto the token ourselves. Without
     * this, every `session.user.role` check downstream reads `undefined` and
     * all agency/partner/admin endpoints reject every caller.
     */
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.orgId = user.orgId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      // The JWT carries an index signature, so narrow what we wrote in `jwt`
      // back to the app's role type rather than trusting an implicit cast.
      session.user.role = toAppRole(token.role);
      session.user.orgId = typeof token.orgId === "string" ? token.orgId : null;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register") ||
        request.nextUrl.pathname.startsWith("/verify");

      if (isAuthPage) {
        // Allow access to auth pages
        return true;
      }

      if (isLoggedIn) {
        // Logged in users can access protected routes
        return true;
      }

      // Redirect unauthenticated users to login
      return false;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email as string);
        if (!user) {
          return null;
        }

        if (!user.passwordHash) {
          // User signed up with social, not password
          return null;
        }

        // A suspended or deleted account must not be able to obtain a session,
        // otherwise admin suspension only takes effect at next token refresh.
        if (user.status !== "active") {
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.avatarUrl || undefined,
          role: user.role,
          orgId: user.orgId || undefined,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
