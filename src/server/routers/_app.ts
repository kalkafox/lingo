import { z } from 'zod'
import { procedure, protectedProcedure, router } from '../trpc'
import type { Char, Letter, LingoRow, LingoRows } from '@/types/lingo'
import { defaultChar } from '@/util/defaults'
import { eq, gte, max, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import * as schema from '@/db/schema'
import { db } from '../db'
import cryptoRandomString from 'crypto-random-string'
import { DictionaryResponse } from '@/types/dictionary'

export const appRouter = router({
  createSession: procedure
    .input(
      z.object({
        fingerprint: z.string().optional(),
        settings: z.object({
          firstLetter: z.boolean(),
          length: z.optional(z.number()).default(5),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const wordsCount = await db
        .select({
          id: schema.lingoWordsV2.id,
        })
        .from(schema.lingoWordsV2)
        .where(
          sql`${schema.lingoWordsV2.length} = ${input.settings.length} and ${schema.lingoWordsV2.freq} >= 10000`,
        )

      if (!wordsCount) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Sorry, we don't have any words we can use right now.",
        })
      }

      const randIndex = Math.floor(Math.random() * wordsCount.length)

      const uniqueId = cryptoRandomString({ length: 10, type: 'url-safe' })

      const user = (
        await db.query.lingoUsers.findMany({
          where: eq(schema.lingoUsers.email, ctx.session?.user?.email!),
        })
      )[0]

      const history: LingoRows = []

      if (input.settings.firstLetter) {
        const wordData = await db.query.lingoWordsV2.findFirst({
          where: eq(schema.lingoWordsV2.id, wordsCount[randIndex].id),
        })

        if (wordData) {
          const row: Char[] = [] as LingoRow

          row.push({
            letter: wordData.word.split('')[0].toUpperCase() as Letter,
            correct: true,
            oop: false,
            zilch: false,
          } as Char)

          const blankRows: LingoRow = Array.from(
            { length: wordData.word.length - 1 },
            (_, i) => ({
              letter: null,
              correct: false,
              oop: false,
              zilch: false,
            }),
          )

          blankRows.forEach((c) => {
            row.push(c)
          })

          history.push(row as LingoRow)
        }
      }

      await db.insert(schema.lingoSessions).values({
        uniqueId,
        word: wordsCount[randIndex].id,
        fingerprint: input.fingerprint,
        created: Date.now(),
        owner: user && user.id ? user.id : null,
        history,
        attempts: 0,
      })

      console.log('Created session.')

      return uniqueId
    }),
  claimSession: protectedProcedure.input(z.string()).mutation(async (q) => {
    //console.log(q.ctx.session.user.name)

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
        with: {
          userId: true,
          wordId: true,
        },
      })

      if (!session) {
        throw new TRPCError({
          code: 'PARSE_ERROR',
          message: 'Could not find session.',
        })
      }

      return {
        finished: session.finished,
        created: session.created,
        history: session.history,
        fingerprint: session.fingerprint,
        wordLength: session.wordId ? session.wordId.word.length : 0,
        word: session.finished && session.wordId && session.wordId.word,
        owner: session.userId && {
          name: session.userId.name,
          image: session.userId.image,
        },
      }
    }),
  getDefinition: procedure.input(z.string()).query(async ({ input }) => {
    const api_url = `https://api.dictionaryapi.dev/api/v2/entries/en/${input}`

    const res = await fetch(api_url)

    return (await res.json()) as DictionaryResponse
  }),
  guessWord: procedure
    .input(
      z.object({
        word: z.string().max(255).toUpperCase(),
        id: z.string().max(10),
      }),
    )
    .mutation(async (q) => {
      const exampleWord = 'furry'.toUpperCase()

      if (!q.input.id || q.input.id.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Empty ID.',
        })
      }

      const session = await db.query.lingoSessions.findFirst({
        where: eq(schema.lingoSessions.uniqueId, q.input.id),
        with: { wordId: true },
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Could not find session.',
        })
      }

      if (!session.wordId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Word not found somehow',
        })
      }

      if (q.input.word.length > session.wordId.word.length) {
        return { invalid: true }
      }

      console.log(session.wordId)

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

      const inputWordData = await db.query.lingoWordsV2.findFirst({
        where: eq(schema.lingoWordsV2.word, q.input.word),
      })

      const inputLetters = q.input.word.split('')

      console.log(q.input.word)

      const wordCheck = await db.query.lingoWords.findFirst({
        where: eq(schema.lingoWords.word, q.input.word + '\r'),
      })

      console.log(wordCheck)

      if (!wordCheck || wordCheck.word.length === 0) {
        return { invalid: true }
      }

      if (!inputWordData || inputWordData.word.length === 0) {
        // const result = inputLetters.map((c) => {
        //   return {
        //     ...defaultChar,
        //     letter: c,
        //     // todo: refactor this
        //     invalid: true,
        //   } as Char
        if (!wordCheck) return { invalid: true }
      }

      // let history = session.history

      // if (typeof history === 'string') {
      //   // the most retarded fucking code i've ever had to deal with in my life
      //   history = JSON.parse(history) as LingoRows
      // }

      if (
        session.history &&
        session.history.find(
          (row) =>
            (row as LingoRow)
              .map((c) => c.letter)
              .join('')
              .toUpperCase() === q.input.word.toUpperCase(),
        )
      ) {
        return { duplicate: true }
      }

      const letters = session.wordId.word.toUpperCase().split('')

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
        } else {
          c.zilch = !c.zilch
          c.oop = false
        }

        if (
          c.letter &&
          session.wordId &&
          session.wordId.word.toUpperCase().includes(c.letter) &&
          !c.oop &&
          !tbl.find(
            (char) => char.letter === c.letter && (char.correct || char.oop),
          )
        ) {
          c.oop = true
        }
        return c
      }) as LingoRow

      let finished = 0

      console.log('hi')

      if (typeof session === 'object' && session && 'history' in session) {
        if (
          parsed.filter((c) => c.correct).length === session.wordId.word.length
        ) {
          // Solved the puzzle!
          finished = Date.now()
        }

        const exists =
          session.history &&
          session.history.find(
            (row) =>
              (row as LingoRow)
                .map((c) => c.letter)
                .join('')
                .toUpperCase() === q.input.word.toUpperCase(),
          )

        if (!exists && session.history) {
          if (
            session.history.length === 1 &&
            session.history.find((row) => row.find((c) => c.letter === null))
          ) {
            session.history.shift()
          }

          session.history.push(parsed)

          await db
            .update(schema.lingoSessions)
            .set({
              history: session.history as LingoRows,
              finished: finished >= 0 ? finished : null,
              attempts: session.attempts++,
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
