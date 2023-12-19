import { z } from 'zod'
import { procedure, router } from '../trpc'
import { Char, LingoRow } from '@/types/lingo'
import { defaultChar } from '@/util/defaults'
export const appRouter = router({
  createSession: procedure.query(async () => {
    // TODO: create a random session with a uid that contains the word to guess
  }),
  guessWord: procedure.input(z.string().length(5)).query(async (q) => {
    const exampleWord = 'furry'.toUpperCase()

    const letters = exampleWord.split('')

    const inputLetters = q.input.split('')

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
