import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '../src/db/config'
import * as schema from '../src/db/schema'
import { eq } from 'drizzle-orm/sql'
const poolConnection = mysql.createPool(config)

export const db = drizzle(poolConnection, { mode: 'default', schema })

const words = await db.query.lingoWordsV2.findMany()

const jobs = words.map((c) =>
  db
    .update(schema.lingoWordsV2)
    .set({
      length: c.word.length,
    })
    .where(eq(schema.lingoWordsV2.id, c.id)),
)

await Promise.all(jobs)

console.log('done.')

poolConnection.end()
