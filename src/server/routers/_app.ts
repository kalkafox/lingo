import { z } from 'zod'
import { procedure, router } from '../trpc'
import { Char, LingoRow } from '@/types/lingo'
import { defaultChar } from '@/util/defaults'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { config } from '@/db/config'
import * as schema from '@/db/schema'
import { eq, gte, max } from 'drizzle-orm'
export const appRouter = router({
  createSession: procedure.query(async () => {
    // TODO: create a random session with a uid that contains the word to guess
  }),
  ping: procedure.input(z.null()).query(() => 'Pong'),
  guessWord: procedure.input(z.string().length(5)).query(async (q) => {
    const exampleWord = 'furry'.toUpperCase()

    const connection = await mysql.createConnection(config)

    console.log(process.env.DATABASE_USERNAME)

    const db = drizzle(connection, { schema, mode: 'default' })

    console.log(db)

    // const wordsCount = await db
    //   .select({
    //     value: max(schema.lingoWords.id),
    //   })
    //   .from(schema.lingoWords)

    // if (
    //   !wordsCount[0].value ||
    //   (wordsCount[0].value && wordsCount[0].value <= 0)
    // ) {
    //   return
    // }

    // const randIndex = Math.floor(Math.random() * (wordsCount[0].value - 0 + 1))

    const exists = await db
      .select()
      .from(schema.lingoWords)
      .where(eq(schema.lingoWords.word, q.input))

    const inputLetters = q.input.split('')

    console.log(exists)

    if (exists.length === 0) {
      const result = inputLetters.map((c) => {
        return {
          ...defaultChar,
          letter: c,
          invalid: true,
        }
      })

      return result
    }

    const letters = exampleWord.split('')

    const result = inputLetters.map((c, index) => {
      return {
        ...defaultChar,
        letter: c,
      } as Char
    }) as LingoRow

    const parsed = result.map((c, index) => {
      if (c.letter === letters[index]) {
        c.correct = !c.correct
        c.oop = false
      } else if (exampleWord.includes(c.letter)) {
        c.oop = true
      } else {
        c.zilch = !c.zilch
        c.oop = false
      }

      return c
    })

    console.log(q.input)

    return parsed
  }),
})

export type AppRouter = typeof appRouter
