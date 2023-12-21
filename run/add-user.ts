import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '@/db/config'
import * as schema from '@/db/schema'

const connection = await mysql.createConnection(config)

console.log(process.env.DATABASE_USERNAME)

const db = drizzle(connection, { schema, mode: 'default' })

Bun.argv.splice(0, 2)

await db.insert(schema.lingoUsers).values({
  uid: Bun.argv[0],
})

console.log(`Added user ${Bun.argv[0]}`)

connection.end()
