// Script to build the db from scratch using parsed words from the internet.

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import config from '../src/db/config'
import * as schema from '../src/db/schema'
import populateWordsV1 from './populate-db'
import populateWordsV2 from './populate-db-v2'

if (!config.host) {
  console.error('Missing DATABASE_HOST')
  process.exit(1)
}

const connection = mysql.createPool(config)

const db = drizzle(connection, { schema, mode: 'default' })

const hosts = ['localhost', '127.0.0.1']

if (!hosts.map((host) => host.trim()).includes(config.host.trim())) {
  console.warn(`
  It looks like you are about to make changes to a database that is outside of the local network.
  Assuming you have the privileges, the script will proceed, but PLEASE double-check your credentials
  to ensure you are not writing to the wrong database!\n\n
  `)

  const confirmation = await askForConfirmation()

  if (confirmation?.toLowerCase().trim() !== 'y') {
    console.log('Exiting script...')
    process.exit(0)
  }
}

async function askForConfirmation() {
  process.stdout.write('Please confirm to continue (y/n): ')

  for await (const line of console) {
    console.log(line)
    return line
  }
}

try {
  await db.execute(sql`SELECT 1`)
} catch (e) {
  console.error(
    'Could not establish connection to database. Are you sure you entered the right credentials?',
  )
  console.error(e)
  process.exit(1)
}

async function main() {
  const now = Date.now()

  try {
    console.log('Running populateWordsV1...')
    await populateWordsV1(db)
    console.log('Running populateWordsV2...')
    await populateWordsV2(db)
  } catch (e) {
    console.log(
      'Could not run queries. Are you sure the schema is synchronized to the database?',
    )
    console.log(e)
  }

  console.log(`Finished in ${Date.now() - now}ms`)
}

await main()

connection.end()
