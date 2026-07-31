import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "./auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
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
