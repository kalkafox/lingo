import Papa from 'papaparse'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '../src/db/config'
import * as schema from '../src/db/schema'

const connection = mysql.createPool(config)

console.log(process.env.DATABASE_USERNAME)

const db = drizzle(connection, { schema, mode: 'default' })

const file = Bun.file('run/processed.txt')

const words = (await file.text()).split('\n').filter((w) => w.length != 0)

console.log(`Counted ${words.length} words.`)

const profanity_res = await fetch(
  'https://raw.githubusercontent.com/surge-ai/profanity/main/profanity_en.csv',
)

const profanityParsed = Papa.parse<string[]>(await profanity_res.text())

const profanityHeader = profanityParsed.data.shift()!

const badWords = profanityParsed.data.map((l) => l[0])

const filtered = words.filter((w) => !badWords.includes(w))

console.log(`Filtered ${profanityParsed.data.length - filtered.length} words`)

const jobs = filtered.map((w) =>
  db.insert(schema.lingoWords).values({ word: w }),
)

await Promise.all(jobs)

console.log('Done.')

connection.end()
