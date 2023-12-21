import * as schema from '@/db/schema'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '@/db/config'

export const connection = await mysql.createConnection(config)

export const db = drizzle(connection, { schema, mode: 'default' })

export const tryConnection = async () => {
  const connection = await mysql.createConnection(config)
  return connection
}
