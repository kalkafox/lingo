import { z } from 'zod'
import { procedure, router } from '../trpc'
import { Char, LingoRow, LingoRows } from '@/types/lingo'
import { defaultChar } from '@/util/defaults'
import { eq, max } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import * as schema from '@/db/schema'
import { db, tryConnection } from '../db'
import cryptoRandomString from 'crypto-random-string'

export const appRouter = router({
  createSession: procedure.input(z.null()).query(async ({ ctx, input }) => {
    // TODO: create a random session with a uid that contains the word to guess
    const wordsCount = await db
      .select({
        value: max(schema.lingoWords.id),
      })
      .from(schema.lingoWords)

    if (
      !wordsCount[0].value ||
      (wordsCount[0].value && wordsCount[0].value <= 0)
    ) {
      return
    }

    const randIndex = Math.floor(Math.random() * (wordsCount[0].value - 0 + 1))

    const uniqueId = cryptoRandomString({ length: 10, type: 'base64' })

    console.log(ctx.session?.user?.name!)

    const user = (
      await db.query.lingoUsers.findMany({
        where: eq(schema.lingoUsers.email, ctx.session?.user?.email!),
      })
    )[0]

    await db.insert(schema.lingoSessions).values({
      uniqueId,
      wordId: randIndex,
      created: Date.now(),
      owner: user.id ? user.id : null,
    })

    console.log('Created session.')

    return uniqueId
  }),
  // login: procedure.input(z.string().min(1).max(255)).query(async (q) => {
  //   const connection = await mysql.createConnection(config)

  //   const db = drizzle(connection, { schema, mode: 'default' })

  //   try {
  //     await db.insert(schema.lingoUser).values({
  //       uid: q.input,
  //     })
  //   } catch (e) {
  //     //console.error(e)
  //     // Check if the user is in the db

  //     const res = (
  //       await db
  //         .select()
  //         .from(schema.lingoUser)
  //         .where(eq(schema.lingoUser.uid, q.input))
  //     )[0]);
  //     if (!res) {
  //       throw new TRPCError({
  //         code: 'INTERNAL_SERVER_ERROR',
  //         message: 'User not found.',
  //       })
  //     }

  //     q.ctx.fingerprint = res.uid
  //   }

  //   connection.end()

  //   return 'ok'
  // }),
  ping: procedure.input(z.null()).query(async () => {
    try {
      const conn = await tryConnection()
      conn.end()
      return 'hi'
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not connect to database.',
      })
    }
  }),
  guessWord: procedure
    .input(
      z.object({
        word: z.string().length(5),
        id: z.string(),
      }),
    )
    .query(async (q) => {
      const exampleWord = 'furry'.toUpperCase()

      const session = await db.query.lingoSessions.findFirst({
        where: eq(schema.lingoSessions.uniqueId, q.input.id),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Could not find session.',
        })
      }

      console.log(session)

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
        .where(eq(schema.lingoWords.word, q.input.word))

      const inputLetters = q.input.word.split('')

      console.log(exists)

      if (exists.length === 0) {
        const result = inputLetters.map((c) => {
          return {
            ...defaultChar,
            letter: c,
            invalid: true,
          }
        })

        let history: LingoRow[] = []

        if (
          typeof session === 'object' &&
          session &&
          'history' in session &&
          typeof session.history === 'object' &&
          session.history
        ) {
          const historyData: LingoRows = session.history as LingoRows

          // todo: figure out why this is being a bitch

          history.push(historyData)

          await db
            .update(schema.lingoSessions)
            .set({ history: JSON.stringify(result) })
            .where(eq(schema.lingoSessions.uniqueId, q.input.id))
        }

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
