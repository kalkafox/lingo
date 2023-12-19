import { int, mysqlSchema, text } from 'drizzle-orm/mysql-core'

export const lingoSchema = mysqlSchema('lingo')

export const lingoWords = lingoSchema.table('words', {
  id: int('id').primaryKey().autoincrement(),
  word: text('word').notNull().unique(),
})
