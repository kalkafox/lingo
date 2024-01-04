import Papa from 'papaparse'
import * as schema from '../src/db/schema'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

const DATASET_URL = new URL(
  'https://www.wordfrequency.info/samples/words_219k.txt',
)

const DATASET_PATH = `./${DATASET_URL.pathname.split('/').pop()}`

console.log(DATASET_PATH)

const PROFANITY_URL = new URL(
  'https://raw.githubusercontent.com/surge-ai/profanity/main/profanity_en.csv',
)

const PROFANITY_PATH = `./${PROFANITY_URL.pathname.split('/').pop()}`

console.log(PROFANITY_PATH)

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

const config = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT as string),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: 'lingo',
}

const poolConnection = mysql.createPool(config)

export const db = drizzle(poolConnection, { mode: 'default', schema })

const main = async () => {
  const dataFile = Bun.file(DATASET_PATH)
  const profanityFile = Bun.file(PROFANITY_PATH)

  if (!(await dataFile.exists())) {
    const text = await getString(DATASET_URL)

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

  // for (const row of datasetParsed.data) {
  //   const word = row[1]

  //   if (badWords.includes(word)) {
  //     console.log(`Profanity found: ${word}`)
  //   }
  // }

  console.log(`Filtered ${badWords.length} bad words.`)

  const filteredTasks = datasetParsed.data.filter(
    (l) =>
      l[1] &&
      l[1].length >= 3 &&
      !badWords.includes(l[1]) &&
      /^[a-zA-Z]+$/.test(l[1]),
  )

  const jobs = filteredTasks.map((s) =>
    db.insert(schema.lingoWordsV2).values({
      rank: parseInt(s[0]),
      word: s[1],
      freq: parseInt(s[2]),
      length: s[1].length,
      numberOfTexts: parseInt(s[3]),
      capsPercentage: parseFloat(s[4]),
    }),
  )

  await Promise.all(jobs)

  poolConnection.end()
}

await main()
