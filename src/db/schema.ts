import { relations } from 'drizzle-orm'
import {
  bigint,
  datetime,
  int,
  json,
  mysqlSchema,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'
import { AdapterAccount } from '@auth/core/adapters'
import { LingoRows } from '@/types/lingo'

export const lingoSchema = mysqlSchema('lingo')

export const lingoWords = lingoSchema.table('words', {
  id: int('id').primaryKey().autoincrement(),
  word: varchar('word', { length: 5 }).notNull().unique(),
})

export const lingoUsers = lingoSchema.table('user', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: timestamp('emailVerified', {
    mode: 'date',
    fsp: 3,
  }).defaultNow(),
  image: varchar('image', { length: 255 }),
})

export const lingoAccounts = lingoSchema.table(
  'account',
  {
    userId: varchar('userId', { length: 255 })
      .notNull()
      .references(() => lingoUsers.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 })
      .$type<AdapterAccount['type']>()
      .notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: varchar('refresh_token', { length: 255 }),
    access_token: varchar('access_token', { length: 255 }),
    expires_at: int('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: varchar('id_token', { length: 2048 }),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
)

// export const lingoUser = lingoSchema.table('user', {
//   id: int('id').primaryKey().autoincrement(),
//   uid: varchar('uid', { length: 255 }).notNull().unique(),
//   email: varchar('email', { length: 255 }).notNull().unique(),
//   username: varchar('username', {length: })
// })

export const lingoSessions = lingoSchema.table('game_sessions', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('uid', { length: 10 }),
  wordId: int('wordId')
    .references(() => lingoWords.id)
    .notNull(),
  owner: varchar('userId', { length: 255 }).references(() => lingoUsers.id),
  created: bigint('created_at', { mode: 'number' }).notNull(),
  finished: bigint('finished_at', { mode: 'number' }),
  history: json('history').$type<LingoRows>(),
  fingerprint: varchar('fingerprint', { length: 255 }),
})

export const sessions = lingoSchema.table('session', {
  sessionToken: varchar('sessionToken', { length: 255 }).notNull().primaryKey(),
  userId: varchar('userId', { length: 255 })
    .notNull()
    .references(() => lingoUsers.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = lingoSchema.table(
  'verificationToken',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  }),
)

export const lingoSessionsWordsRelation = relations(lingoWords, ({ one }) => ({
  word: one(lingoSessions),
}))

export const lingoSessionsOwnerRelation = relations(lingoUsers, ({ one }) => ({
  uid: one(lingoSessions),
}))
