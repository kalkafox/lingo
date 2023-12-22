import { z } from 'zod'
import { procedure, protectedProcedure, router } from '../trpc'
import { Char, LingoRow, LingoRows } from '@/types/lingo'
import { defaultChar } from '@/util/defaults'
import { eq, max } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import * as schema from '@/db/schema'
import { db } from '../db'
import cryptoRandomString from 'crypto-random-string'

export const appRouter = router({
  createSession: procedure
    .input(z.string().optional())
    .query(async ({ ctx, input }) => {
      const wordsCount = await db
        .select({
          value: max(schema.lingoWords.id),
        })
        .from(schema.lingoWords)

      if (
        !wordsCount[0].value ||
        (wordsCount[0].value && wordsCount[0].value <= 0)
      ) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Sorry, we don't have any words we can use right now.",
        })
      }

      const randIndex = Math.floor(
        Math.random() * (wordsCount[0].value - 0 + 1),
      )

      const uniqueId = cryptoRandomString({ length: 10, type: 'url-safe' })

      const user = (
        await db.query.lingoUsers.findMany({
          where: eq(schema.lingoUsers.email, ctx.session?.user?.email!),
        })
      )[0]

      await db.insert(schema.lingoSessions).values({
        uniqueId,
        wordId: randIndex,
        fingerprint: input,
        created: Date.now(),
        owner: user && user.id ? user.id : null,
      })

      console.log('Created session.')

      return uniqueId
    }),
  claimSession: protectedProcedure.input(z.string()).query(async (q) => {
    console.log(q.ctx.session.user.name)

    const session = await db.query.lingoSessions.findFirst({
      where: eq(schema.lingoSessions.uniqueId, q.input),
    })

    if (!session) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Could not find session.',
      })
    }

    if (session.owner) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Session is already claimed!',
      })
    }

    try {
      // Get user info

      if (!q.ctx.session.user.name) {
        // this shouldn't happen, but just in case
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const user = await db.query.lingoUsers.findFirst({
        where: eq(schema.lingoUsers.name, q.ctx.session.user.name),
      })

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' })
      }

      await db.update(schema.lingoSessions).set({
        owner: user.id,
      })

      return 'ok!'
    } catch (e) {
      console.error(e)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database error.',
      })
    }
  }),
  ping: procedure.input(z.null()).query(async () => {
    // try {
    //   const conn = await tryConnection()
    //   conn.end()
    //   return 'hi'
    // } catch (e) {
    //   throw new TRPCError({
    //     code: 'INTERNAL_SERVER_ERROR',
    //     message: 'Could not connect to database.',
    //   })
    // }
    return 'hi'
  }),
  getSessionInfo: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      if (!input.id || input.id.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Empty ID.',
        })
      }

      const session = await db.query.lingoSessions.findFirst({
        where: eq(schema.lingoSessions.uniqueId, input.id),
      })

      if (!session) {
        throw new TRPCError({
          code: 'PARSE_ERROR',
          message: 'Could not find session.',
        })
      }

      const owner = session.owner
        ? await db.query.lingoUsers.findFirst({
            where: eq(schema.lingoUsers.id, session.owner),
          })
        : null

      return {
        finished: session.finished,
        created: session.created,
        history: session.history,
        fingerprint: session.fingerprint,
        owner,
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

      if (!q.input.id || q.input.id.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Empty ID.',
        })
      }

      const session = await db.query.lingoSessions.findFirst({
        where: eq(schema.lingoSessions.uniqueId, q.input.id),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Could not find session.',
        })
      }

      const sessionWordData = await db.query.lingoWords.findFirst({
        where: eq(schema.lingoWords.id, session.wordId),
      })

      if (!sessionWordData) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Word not found somehow',
        })
      }

      if (typeof session === 'object' && session && 'history' in session) {
        let historyData: LingoRows = []

        if (typeof session.history === 'string' && session.history) {
          historyData = JSON.parse(session.history) as LingoRows

          console.log(historyData)

          // if (
          //   historyData.find(
          //     (row) =>
          //       row
          //         .map((c) => c.letter)
          //         .join('')
          //         .toUpperCase() === q.input.word.toUpperCase(),
          //   )
          // ) {
          //   return {
          //     message: 'Same word found. Try another!',
          //   }
          // }
        }
      }

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

      const inputWordData = await db.query.lingoWords.findFirst({
        where: eq(schema.lingoWords.word, q.input.word),
      })

      const inputLetters = q.input.word.split('')

      if (!inputWordData || inputWordData.word.length === 0) {
        const result = inputLetters.map((c) => {
          return {
            ...defaultChar,
            letter: c,
            // todo: refactor this
            invalid: true,
          } as Char
        }) as LingoRow

        const history = session.history || []
        console.log(history)

        if (
          !history.find(
            (row) =>
              (row as LingoRow)
                .map((c) => c.letter)
                .join('')
                .toUpperCase() === q.input.word.toUpperCase(),
          )
        ) {
          history.push(result)
          await db
            .update(schema.lingoSessions)
            .set({ history: history })
            .where(eq(schema.lingoSessions.uniqueId, q.input.id))
          return { duplicate: true }
        }
      }

      const letters = sessionWordData.word.toUpperCase().split('')

      console.log(sessionWordData.word)

      const result = inputLetters.map((c, index) => {
        return {
          ...defaultChar,
          letter: c,
        } as Char
      }) as LingoRow

      const parsed = result.map((c, index, tbl) => {
        if (c.letter === letters[index]) {
          c.correct = !c.correct
          c.oop = false
        } else if (
          sessionWordData.word.toUpperCase().includes(c.letter) &&
          !c.oop &&
          !tbl.find(
            (char) => char.letter === c.letter && (char.correct || char.oop),
          )
        ) {
          c.oop = true
        } else {
          c.zilch = !c.zilch
          c.oop = false
        }

        return c
      }) as LingoRow

      let finished = 0

      if (typeof session === 'object' && session && 'history' in session) {
        if (parsed.filter((c) => c.correct).length === 5) {
          // Solved the puzzle!
          finished = Date.now()
        }

        const history = session.history || []

        const exists = history.find(
          (row) =>
            (row as LingoRow)
              .map((c) => c.letter)
              .join('')
              .toUpperCase() === q.input.word.toUpperCase(),
        )

        if (!exists) {
          history.push(parsed)

          await db
            .update(schema.lingoSessions)
            .set({
              history: history as LingoRows,
              finished: finished >= 0 ? finished : null,
            })
            .where(eq(schema.lingoSessions.uniqueId, q.input.id))
        } else {
          return { duplicate: true }
        }
      }

      return parsed
    }),
})

export type AppRouter = typeof appRouter
