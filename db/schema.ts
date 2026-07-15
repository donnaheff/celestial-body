import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  uuid,
  primaryKey,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

/* ── Auth.js standard tables (DrizzleAdapter) ──────────────────────────── */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role", { enum: ["client", "admin"] })
    .notNull()
    .default("client"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ([
  uniqueIndex("users_email_unique_idx").on(table.email),
]));

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ([
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ])
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ([primaryKey({ columns: [vt.identifier, vt.token] })])
);

/* ── Product tables ─────────────────────────────────────────────────────
   Status machine (Brief.status):
     submitted -> under_review -> quoted -> (declined -> under_review)*
                                          -> escrow_pending -> escrow_funded -> completed
   "declined" is a transient UI state client-side; server records it as a
   quote history row with status='declined' and moves the brief back to
   under_review once the client resends with a revised budget.
──────────────────────────────────────────────────────────────────────── */

export const briefStatusValues = [
  "under_review",
  "quoted",
  "declined",
  "escrow_pending",
  "escrow_funded",
  "completed",
] as const;
export type BriefStatus = (typeof briefStatusValues)[number];

export const briefs = pgTable("briefs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  specification: text("specification").notNull(),
  tenderType: text("tender_type").notNull(),
  timeframeWeeks: integer("timeframe_weeks").notNull(),
  budget: numeric("budget", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: briefStatusValues })
    .notNull()
    .default("under_review"),

  // Populated once the active quote is issued (mirrors the latest row in `quotes`).
  quoteAmount: numeric("quote_amount", { precision: 10, scale: 2 }),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
  balanceAmount: numeric("balance_amount", { precision: 10, scale: 2 }),
  varianceNote: text("variance_note"),

  escrowMethod: text("escrow_method", { enum: ["flutterwave", "smart_contract"] }),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const quoteStatusValues = ["issued", "accepted", "declined"] as const;
export type QuoteStatus = (typeof quoteStatusValues)[number];

/** Full negotiation history: one row per issued quote (including revisions). */
export const quotes = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  briefId: uuid("brief_id")
    .notNull()
    .references(() => briefs.id, { onDelete: "cascade" }),
  budgetAtQuote: numeric("budget_at_quote", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).notNull(),
  balanceAmount: numeric("balance_amount", { precision: 10, scale: 2 }).notNull(),
  varianceNote: text("variance_note").notNull(),
  status: text("status", { enum: quoteStatusValues }).notNull().default("issued"),
  issuedByUserId: uuid("issued_by_user_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const escrowMethodValues = ["flutterwave", "smart_contract"] as const;
export const escrowStatusValues = ["pending", "successful", "failed"] as const;

/** One row per funding attempt/settlement, either provider. */
export const escrowTransactions = pgTable("escrow_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  briefId: uuid("brief_id")
    .notNull()
    .references(() => briefs.id, { onDelete: "cascade" }),
  method: text("method", { enum: escrowMethodValues }).notNull(),
  status: text("status", { enum: escrowStatusValues }).notNull().default("pending"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GBP"),

  // Flutterwave
  flwTxRef: text("flw_tx_ref"),
  flwTransactionId: text("flw_transaction_id"),

  // Smart-contract escrow
  chainId: integer("chain_id"),
  contractAddress: text("contract_address"),
  depositTxHash: text("deposit_tx_hash"),
  clientWalletAddress: text("client_wallet_address"),

  rawPayload: jsonb("raw_payload"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/* ── Relations (enables db.query.*.findMany({ with: {...} })) ─────────── */

export const usersRelations = relations(users, ({ many }) => ({
  briefs: many(briefs),
}));

export const briefsRelations = relations(briefs, ({ one, many }) => ({
  user: one(users, { fields: [briefs.userId], references: [users.id] }),
  quotes: many(quotes),
  escrowTransactions: many(escrowTransactions),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  brief: one(briefs, { fields: [quotes.briefId], references: [briefs.id] }),
  issuedBy: one(users, { fields: [quotes.issuedByUserId], references: [users.id] }),
}));

export const escrowTransactionsRelations = relations(escrowTransactions, ({ one }) => ({
  brief: one(briefs, { fields: [escrowTransactions.briefId], references: [briefs.id] }),
}));
