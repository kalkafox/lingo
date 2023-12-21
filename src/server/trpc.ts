import { initTRPC } from '@trpc/server'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { getServerAuthSession } from './auth'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '@/db/config'

import * as schema from '@/db/schema'

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.

export const createContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts
  const session = await getServerAuthSession({ req, res })

  return {
    session,
  }
}

const t = initTRPC.context<typeof createContext>().create()
// Base router and procedure helpers
export const router = t.router
export const procedure = t.procedure
