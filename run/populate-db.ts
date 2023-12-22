import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '@/db/config'
import * as schema from '@/db/schema'

const connection = mysql.createPool(config)

console.log(process.env.DATABASE_USERNAME)

const db = drizzle(connection, { schema, mode: 'default' })

const file = Bun.file('run/processed.txt')

const words = (await file.text()).split('\n').filter((w) => w.length != 0)

console.log(`Counted ${words.length} words.`)

const jobs = []

for (const word of words) {
  jobs.push(
    db.insert(schema.lingoWords).values({
      word,
    }),
  )
}

await Promise.all(jobs)

console.log('Done.')

connection.end()
