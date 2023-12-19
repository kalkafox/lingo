import { z } from 'zod'
import { procedure, router } from '../trpc'
import { LingoRow } from '@/types/lingo'
export const appRouter = router({
  createSession: procedure.query(async () => {
    // TODO: create a random session with a uid that contains the word to guess
  }),
  guessWord: procedure
    .input(
      z.array(
        z.object({
          oop: z.boolean(),
          letter: z.string().length(1).toUpperCase(),
          zilch: z.boolean(),
          correct: z.boolean(),
        }),
      ),
    )
    .query(async (q) => {
      const exampleWord = 'furry'.toUpperCase()

      const letters = exampleWord.split('')

      const inputLetters = q.input as LingoRow

      const parsed = inputLetters.map((c, index) => {
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
