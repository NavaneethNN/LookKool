import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import { users, session, account, verification } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { sendWelcomeEmail } from "@/lib/email";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session,
      account,
      verification,
    },
  }),

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — for Edge middleware cookie-only checks
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendEmail({
          to: [{ email: user.email, name: user.name }],
          subject: "Reset your password",
          htmlContent: `
            <p>Hi ${user.name},</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${url}">${url}</a></p>
            <p>This link will expire in 1 hour.</p>
          `,
        });
      } catch (err) {
        console.error("Failed to send reset password email:", err);
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendEmail({
          to: [{ email: user.email, name: user.name }],
          subject: "Verify your email address",
          htmlContent: `
            <p>Hi ${user.name},</p>
            <p>Click the link below to verify your email:</p>
            <p><a href="${url}">${url}</a></p>
            <p>This link will expire in 24 hours.</p>
          `,
        });
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        try {
          await sendEmail({
            to: [{ email }],
            subject: "Your sign-in link",
            htmlContent: `
              <p>Click the link below to sign in:</p>
              <p><a href="${url}">${url}</a></p>
              <p>This link will expire in 5 minutes.</p>
            `,
          });
        } catch (err) {
          console.error("Failed to send magic link email:", err);
        }
      },
    }),
  ],

  user: {
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: false,
        fieldName: "phoneNumber",
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        fieldName: "role",
      },
      loyaltyPoints: {
        type: "number",
        required: false,
        defaultValue: 0,
        fieldName: "loyaltyPoints",
      },
      creditBalance: {
        type: "string",
        required: false,
        defaultValue: "0.00",
        fieldName: "creditBalance",
      },
      totalSpent: {
        type: "string",
        required: false,
        defaultValue: "0.00",
        fieldName: "totalSpent",
      },
      lastLoginAt: {
        type: "string",
        required: false,
        fieldName: "lastLoginAt",
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Send welcome email for new users (fire-and-forget)
          sendWelcomeEmail({
            name: user.name,
            email: user.email,
          }).catch(() => {});
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Update lastLoginAt on session creation
          try {
            await db
              .update(users)
              .set({ lastLoginAt: new Date() })
              .where(eq(users.id, session.userId));
          } catch {
            // non-critical — ignore
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
