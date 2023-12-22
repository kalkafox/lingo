import * as schema from '@/db/schema'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '@/db/config'

const poolConnection = mysql.createPool(config)

export const db = drizzle(poolConnection, { mode: 'default', schema })
