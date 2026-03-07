import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { db } from './db';

export const auth = betterAuth({
  plugins: [tanstackStartCookies()],
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  advanced: {
    database: { generateId: false },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  secret: process.env.BETTER_AUTH_SECRET as string,
  baseURL: process.env.BETTER_AUTH_URL as string,
});
