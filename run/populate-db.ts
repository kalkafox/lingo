import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import Papa from 'papaparse'
import config from '../src/db/config'
import * as schema from '../src/db/schema'

/** Populate db with every possible word in the dictionary.
 *
 */
export default async function populateWordsV1(
  db: MySql2Database<typeof schema>,
) {
  const file = await fetch(
    'https://gist.githubusercontent.com/kalkafox/f7855da96e0dc1ebdbe6e9f28912b2d0/raw/a04c9a317fcc47a984ee723c03cd4572603fc3a5/processed.txt',
  )

  const words = (await file.text()).split('\n').filter((w) => w.length != 0)

  console.log(`Counted ${words.length} words.`)

  const profanity_res = await fetch(
    'https://raw.githubusercontent.com/surge-ai/profanity/main/profanity_en.csv',
  )

  const profanityParsed = Papa.parse<string[]>(await profanity_res.text())

  profanityParsed.data.shift()

  const badWords = profanityParsed.data.map((l) => l[0])

  const badWordsSet = new Set(badWords)

  const filtered = words
    .filter((w) => !badWordsSet.has(w))
    .map((w) => ({ word: w }))

  const batchSize = 50000

  for (let i = 0; i < filtered.length; i += batchSize) {
    const batch = filtered.slice(i, i + batchSize)

    await db.insert(schema.lingoWords).values(batch)
    console.log(
      `Populated lingoWords table with ${batch.length} columns. (${
        i + batch.length
      })`,
    )
  }

  console.log('Done.')
}

// If run directly, assume the user wants to populate this particular table

async function main() {
  const connection = await mysql.createConnection(config)

  const db = drizzle(connection, { schema, mode: 'default' })

  await populateWordsV1(db)

  connection.end()
}
