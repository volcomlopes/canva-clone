import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

// ============================================
// ENUMS — Tipos pré-definidos (níveis de usuário)
// ============================================
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",      // Você, dono do Artbase
  "brand_admin",      // Admin da marca (ex: GWM)
  "dealership_admin", // Admin da unidade (concessionária)
  "user",             // Usuário final (vendedor)
]);

// ============================================
// NOVA TABELA: BRANDS (Marcas / Clientes)
// ============================================
export const brands = pgTable("brand", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logoUrl"),
  primaryColor: text("primaryColor"),
  secondaryColor: text("secondaryColor"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

// ============================================
// NOVA TABELA: DEALERSHIPS (Unidades / Concessionárias)
// ============================================
export const dealerships = pgTable("dealership", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  brandId: text("brandId")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  city: text("city"),
  state: text("state"),
  phone: text("phone"),
  address: text("address"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

// ============================================
// NOVA TABELA: INVITES (Convites por email)
// ============================================
export const invites = pgTable("invite", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull(),
  brandId: text("brandId")
    .references(() => brands.id, { onDelete: "cascade" }),
  dealershipId: text("dealershipId")
    .references(() => dealerships.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  accepted: boolean("accepted").notNull().default(false),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// ============================================
// TABELA ATUALIZADA: USERS (com role + brand + dealership)
// ============================================
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  // ⬇️ Novos campos pro multi-tenant
  role: userRoleEnum("role").notNull().default("user"),
  brandId: text("brandId")
    .references(() => brands.id, { onDelete: "set null" }),
  dealershipId: text("dealershipId")
    .references(() => dealerships.id, { onDelete: "set null" }),
});

// ============================================
// BRAND ASSETS - Fotos oficiais da marca
// ============================================
export const brandAssets = pgTable("brandAsset", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  brandId: text("brandId")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  category: text("category"),
  fileName: text("fileName"),
  fileSize: text("fileSize"),
  uploadedBy: text("uploadedBy")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});


// ============================================
// RELACIONAMENTOS
// ============================================
export const usersRelations = relations(users, ({ many, one }) => ({
  projects: many(projects),
  brand: one(brands, {
    fields: [users.brandId],
    references: [brands.id],
  }),
  dealership: one(dealerships, {
    fields: [users.dealershipId],
    references: [dealerships.id],
  }),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  dealerships: many(dealerships),
  users: many(users),
  projects: many(projects),
}));

export const dealershipsRelations = relations(dealerships, ({ one, many }) => ({
  brand: one(brands, {
    fields: [dealerships.brandId],
    references: [brands.id],
  }),
  users: many(users),
}));

// ============================================
// TABELAS DO NEXTAUTH (não mexer)
// ============================================
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)

// ============================================
// TABELA ATUALIZADA: PROJECTS (com brandId)
// ============================================
export const projects = pgTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  // ⬇️ Novo campo: saber a qual marca o projeto pertence
  brandId: text("brandId")
    .references(() => brands.id, { onDelete: "cascade" }),
  json: text("json").notNull(),
  height: integer("height").notNull(),
  width: integer("width").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  isTemplate: boolean("isTemplate"),
  isPro: boolean("isPro"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
});

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  brand: one(brands, {
    fields: [projects.brandId],
    references: [brands.id],
  }),
}));

export const projectsInsertSchema = createInsertSchema(projects);

// ============================================
// TABELA DE ASSINATURAS (não mexer)
// ============================================
export const subscriptions = pgTable("subscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade"
    }),
  subscriptionId: text("subscriptionId").notNull(),
  customerId: text("customerId").notNull(),
  priceId: text("priceId").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
});

// ============================================
// BRAND KIT - Identidade visual da marca
// ============================================
export const brandKits = pgTable("brandKit", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  brandId: text("brandId")
    .notNull()
    .unique()
    .references(() => brands.id, { onDelete: "cascade" }),

  // Slots fixos de cores (nomeados)
  colorPrimary: text("colorPrimary").default("#3B82F6"),       // azul
  colorSecondary: text("colorSecondary").default("#1F2937"),   // cinza escuro
  colorText: text("colorText").default("#0F172A"),             // preto suave
  colorBackground: text("colorBackground").default("#FFFFFF"), // branco
  colorAccent: text("colorAccent").default("#94A3B8"),         // cinza claro

  // Paleta extra: JSON array com cores livres
  // Formato: [{ name: "Cor especial", hex: "#FF0000" }, ...]
  colorsExtra: text("colorsExtra").default("[]"),

  // Logos (preencher na Parte 2)
  logoPrimary: text("logoPrimary"),
  logoMonoWhite: text("logoMonoWhite"),
  logoMonoBlack: text("logoMonoBlack"),
  logoHorizontal: text("logoHorizontal"),
  logoVertical: text("logoVertical"),
  favicon: text("favicon"),

  // Fontes (4 slots)
  fontHeading: text("fontHeading"),
  fontSubheading: text("fontSubheading"),
  fontBody: text("fontBody"),
  fontHighlight: text("fontHighlight"),

  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const brandKitsRelations = relations(brandKits, ({ one }) => ({
  brand: one(brands, {
    fields: [brandKits.brandId],
    references: [brands.id],
  }),
}));