import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '@/db/config'
import * as schema from '@/db/schema'

const connection = await mysql.createConnection(config)

console.log(process.env.DATABASE_USERNAME)

const db = drizzle(connection, { schema, mode: 'default' })

const file = Bun.file('run/processed.txt')

const words = (await file.text()).split('\r\n')

console.log(`Counted ${words.length} words.`)

words
  .filter((w) => w.length != 0)
  .forEach(async (word) => {
    try {
      await db.insert(schema.lingoWords).values({
        word,
      })
    } catch (e) {
      console.error(e)
    }
  })
