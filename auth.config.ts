import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";
import Twitter from "next-auth/providers/twitter";

// Edge-safe subset of the auth config: no adapter, no Credentials provider
// (its `authorize` touches the DB via `pg`, which isn't Edge-compatible),
// no DB reads in callbacks. This is what middleware uses to check session
// presence/role on every request without ever bundling the Postgres driver.
// The full config in auth.ts extends this with the adapter + Credentials.

const oauthProviders = [
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })
    : null,
  process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET
    ? Apple({ clientId: process.env.AUTH_APPLE_ID, clientSecret: process.env.AUTH_APPLE_SECRET })
    : null,
  process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
    ? Facebook({ clientId: process.env.AUTH_FACEBOOK_ID, clientSecret: process.env.AUTH_FACEBOOK_SECRET })
    : null,
  process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET
    ? Twitter({ clientId: process.env.AUTH_TWITTER_ID, clientSecret: process.env.AUTH_TWITTER_SECRET })
    : null,
].filter((p): p is NonNullable<typeof p> => p !== null);

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  trustHost: true,
  providers: oauthProviders,
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present at sign-in — role is embedded in the token
      // then, and never re-read from the DB on subsequent requests. This is
      // what keeps middleware DB-free; role changes take effect next sign-in.
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "client";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "client" | "admin") ?? "client";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
