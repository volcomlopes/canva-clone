import { z } from "zod";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { eq } from "drizzle-orm";
import { JWT } from "next-auth/jwt";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ============================================
// TIPOS PERSONALIZADOS — Artbase Multi-tenant
// ============================================

// Tipo do role do usuário (igual ao enum do schema)
type UserRole = "super_admin" | "brand_admin" | "dealership_admin" | "user";

// Estende o tipo JWT para incluir os campos do Artbase
declare module "next-auth/jwt" {
  interface JWT {
    id: string | undefined;
    role: UserRole | undefined;
    brandId: string | null | undefined;
    dealershipId: string | null | undefined;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string | undefined;
    role: UserRole | undefined;
    brandId: string | null | undefined;
    dealershipId: string | null | undefined;
  }
}

// Estende o tipo Session para incluir os campos do Artbase
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      brandId: string | null;
      dealershipId: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export default {
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        pasword: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = CredentialsSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const query = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        const user = query[0];

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          password,
          user.password,
        );

        if (!passwordsMatch) {
          return null;
        }

        return user;
      },
    }),
    GitHub,
    Google
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in"
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // ============================================
    // SESSION CALLBACK — Adiciona dados do Artbase à sessão
    // ============================================
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }

      // Adiciona os dados do multi-tenant na sessão
      if (token.role) {
        session.user.role = token.role;
      }

      if (token.brandId !== undefined) {
        session.user.brandId = token.brandId ?? null;
      }

      if (token.dealershipId !== undefined) {
        session.user.dealershipId = token.dealershipId ?? null;
      }

      return session;
    },

    // ============================================
    // JWT CALLBACK — Busca dados do banco e adiciona ao token
    // ============================================
    async jwt({ token, user }) {
      // Primeira vez fazendo login: pega dados do user
      if (user) {
        token.id = user.id;
      }

      // Em TODA requisição: busca dados atualizados no banco
      // (importante para refletir mudanças de role em tempo real)
      if (token.id) {
        const dbUser = await db
          .select({
            id: users.id,
            role: users.role,
            brandId: users.brandId,
            dealershipId: users.dealershipId,
          })
          .from(users)
          .where(eq(users.id, token.id))
          .limit(1);

        if (dbUser[0]) {
          token.role = dbUser[0].role as UserRole;
          token.brandId = dbUser[0].brandId;
          token.dealershipId = dbUser[0].dealershipId;
        }
      }

      return token;
    }
  },
} satisfies NextAuthConfig