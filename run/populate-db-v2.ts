import { MySql2Database, drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import Papa from 'papaparse'
import config from '../src/db/config'
import * as schema from '../src/db/schema'

const DATASET_URL = new URL(
  'https://www.wordfrequency.info/samples/words_219k.txt',
)

const DATASET_PATH = `./${DATASET_URL.pathname.split('/').pop()}`

const PROFANITY_URL = new URL(
  'https://raw.githubusercontent.com/surge-ai/profanity/main/profanity_en.csv',
)

const PROFANITY_PATH = `./${PROFANITY_URL.pathname.split('/').pop()}`

const getString = async (url: string | URL) => {
  const response = await fetch(url)

  if (!response.ok || !response.body) {
    console.error(
      `Failed to get data, somehow. ${response.statusText} (server returned ${response.status})`,
    )
    process.exit(1)
  }

  return await response.text()
}

export default async function populateWordsV2(
  db: MySql2Database<typeof schema>,
) {
  const dataFile = Bun.file(DATASET_PATH)
  const profanityFile = Bun.file(PROFANITY_PATH)

  if (!(await dataFile.exists())) {
    const text = await getString(DATASET_URL)

    // From the dataset:
    // ----- Before converting file to Excel, remove the first eight lines, with the first line being the one starting with "rank"
    const lines = text.split('\n').slice(8).join('\n')

    await Bun.write(dataFile, lines)
  }

  if (!(await profanityFile.exists())) {
    await Bun.write(profanityFile, await getString(PROFANITY_URL))
  }

  const datasetLines = await dataFile.text()

  const profanityLines = await profanityFile.text()

  const datasetParsed = Papa.parse<string[]>(datasetLines)

  const profanityParsed = Papa.parse<string[]>(profanityLines)

  if (datasetParsed.data.length === 0 || profanityParsed.data.length === 0) {
    console.error(
      `Somehow, either profanity or dataset is empty. Dataset: ${datasetParsed.data.length}, Parsed: ${profanityParsed.data.length}`,
    )
  }

  const profanityHeader = profanityParsed.data.shift()!
  const datasetHeader = datasetParsed.data.shift()!

  console.log(datasetHeader)

  console.log(datasetParsed.data[0])

  const badWords = profanityParsed.data.map((l) => l[0])

  console.log(`Filtered ${badWords.length} bad words.`)

  const filtered = datasetParsed.data
    .filter(
      (l) =>
        l[1]?.length >= 3 &&
        !badWords.includes(l[1]) &&
        /^[a-zA-Z]+$/.test(l[1]),
    )
    .map((s) => ({
      rank: parseInt(s[0]),
      word: s[1],
      freq: parseInt(s[2]),
      length: s[1].length,
      numberOfTexts: parseInt(s[3]),
      capsPercentage: parseFloat(s[4]),
    }))

  const batchSize = 10000

  for (let i = 0; i < filtered.length; i += batchSize) {
    const batch = filtered.slice(i, i + batchSize)

    await db.insert(schema.lingoWordsV2).values(batch)
    console.log(
      `Populated lingoWordsV2 table with ${batch.length} columns. (${
        i + batch.length
      })`,
    )
  }
}

// If run directly, assume the user wants to populate this particular table

async function main() {
  const connection = await mysql.createConnection(config)

  const db = drizzle(connection, { schema, mode: 'default' })

  await populateWordsV2(db)

  connection.end()
}
