import { Inter } from 'next/font/google'
import { useState } from 'react'
import type { Char, GuessedLingoRow, Letter, LingoRow } from '@/types/lingo'
import { useAtom } from 'jotai'
import { lingoHistoryAtom, lingoRowAtom } from '@/util/atoms'
import { trpc } from '@/util/trpc'
import { defaultChar } from '@/util/defaults'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [history, setHistory] = useAtom(lingoHistoryAtom)
  const [words, setWords] = useAtom(lingoRowAtom)

  const [guessedWords, setGuessedWords] = useState<GuessedLingoRow>([])

  const pingQuery = trpc.ping.useQuery(null, { refetchInterval: 3000 })

  const guessWordQuery = trpc.guessWord.useQuery(
    words.map((c) => c.letter).join(''),
    {
      refetchOnMount: false,
      enabled: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  console.log(guessedWords.length)

  return (
    <div
      className='absolute w-full h-full'
      tabIndex={0}
      onKeyDown={async (e) => {
        if (e.key === 'Backspace') {
          setWords((prev) => {
            const newLetters = prev.slice(0, -1) as LingoRow
            console.log(newLetters)
            return newLetters
          })
        }

        if (words.length < 5) {
          const isAlphabetical = /^[a-zA-Z]$/.test(e.key)
          if (isAlphabetical) {
            setWords((prev) => {
              return [
                ...prev,
                { ...defaultChar, letter: e.key.toUpperCase() },
              ].slice(0, 5) as LingoRow
            })
          }
        }

        if (words.length === 5 && e.key === 'Enter') {
          const res = await guessWordQuery.refetch()

          if (!res.error) {
            console.log(res.data)
            setHistory((prev) => {
              return [...prev, res.data as LingoRow]
            })
            setWords([])

            // setGuessedWords(
            //   res.data?.map((l) =>
            //     l.correct
            //       ? { letter: l.letter, correct: true }
            //       : { letter: '.', correct: false },
            //   ) as GuessedLingoRow,
            // )

            if (res.data?.find((l) => l.correct)) {
              setGuessedWords(
                res.data?.map((l) =>
                  l.correct
                    ? { letter: l.letter, correct: true }
                    : { letter: '.', correct: false },
                ) as GuessedLingoRow,
              )
            }
          }
        }
      }}>
      {history &&
        history.map((value, index, array) => {
          console.log(value)
          return (
            <div
              key={index}
              className={`relative flex gap-x-2 py-1 self-center justify-center select-none`}>
              {value.map((v, index) => {
                return (
                  <div
                    className={`inline w-10 h-10 border-2 ${
                      (v.correct && 'bg-green-500/80') ||
                      (v.oop && 'bg-yellow-500/80') ||
                      (v.invalid && 'bg-gray-500')
                    }`}>
                    <div className='flex text-center justify-center self-center relative top-1'>
                      {(v && v.letter) ?? '.'}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      <div className='relative flex gap-x-2 top-5 self-center justify-center select-none'>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className='inline w-10 h-10 border-2'>
            <div className='flex text-center justify-center self-center relative top-1'>
              {(words[i] && words[i].letter) ?? '.'}
            </div>
          </div>
        ))}
      </div>
      <div
        className={`relative flex gap-x-2 py-10 self-center justify-center select-none`}>
        {guessedWords &&
          guessedWords.map((value, index, array) => {
            return (
              <div
                key={index}
                className={`inline w-10 h-10 border-2 ${
                  value.correct && 'bg-green-500/80'
                }`}>
                <div className='flex text-center justify-center self-center relative top-1'>
                  {(value && value.letter) ?? '.'}
                </div>
              </div>
            )
          })}
      </div>
      <div
        className={`w-5 h-5 ${
          pingQuery.isRefetchError || pingQuery.isError
            ? 'bg-red-500'
            : pingQuery.isRefetching || pingQuery.isLoading
            ? 'bg-yellow-500'
            : pingQuery.isSuccess
            ? 'bg-green-500'
            : 'bg-gray-500'
        } fixed bottom-0 m-2 rounded-full`}></div>
    </div>
  )
}
