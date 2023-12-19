import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useState } from 'react'
import { assert } from 'console'
import type { Char, Letter, LingoRow } from '@/types/lingo'
import { useAtom } from 'jotai'
import { lingoHistoryAtom, lingoRowAtom } from '@/util/atoms'
import { trpc } from '@/util/trpc'

export const defaultChar: Char = {
  letter: '' as Letter,
  correct: false,
  oop: false,
  zilch: false,
}

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [history, setHistory] = useAtom(lingoHistoryAtom)
  const [words, setWords] = useAtom(lingoRowAtom)

  const guessWord = trpc.guessWord.useQuery(words, {
    refetchOnMount: false,
    enabled: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return (
    <div
      className='fixed w-full h-full'
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
          const res = await guessWord.refetch()

          if (!res.error) {
            console.log(res.data)
            setHistory((prev) => {
              return [...prev, res.data as LingoRow]
            })
            setWords([])
          }
        }
      }}>
      {history &&
        history.map((value, index, array) => {
          console.log(value)
          return (
            <div
              key={index}
              className={`relative flex gap-x-2 py-1 self-center justify-center w-full select-none`}>
              <div
                className={`inline w-10 h-10 border-2 ${
                  (value[0]!.correct && 'bg-green-500/80') ||
                  (value[0]!.oop && 'bg-yellow-500/80')
                }`}>
                <div className='flex text-center justify-center self-center relative top-1'>
                  {(value[0] && value[0].letter) ?? '.'}
                </div>
              </div>
              <div
                className={`inline w-10 h-10 border-2 ${
                  (value[1]!.correct && 'bg-green-500/80') ||
                  (value[1]!.oop && 'bg-yellow-500/80')
                }`}>
                <div className='flex text-center justify-center self-center relative top-1'>
                  {(value[1] && value[1].letter) ?? '.'}
                </div>
              </div>
              <div
                className={`inline w-10 h-10 border-2 ${
                  (value[2]!.correct && 'bg-green-500/80') ||
                  (value[2]!.oop && 'bg-yellow-500/80')
                }`}>
                <div className='flex text-center justify-center self-center relative top-1'>
                  {(value[2] && value[2].letter) ?? '.'}
                </div>
              </div>
              <div
                className={`inline w-10 h-10 border-2 ${
                  (value[3]!.correct && 'bg-green-500/80') ||
                  (value[3]!.oop && 'bg-yellow-500/80')
                }`}>
                <div className='flex text-center justify-center self-center relative top-1'>
                  {(value[3] && value[3].letter) ?? '.'}
                </div>
              </div>
              <div
                className={`inline w-10 h-10 border-2 ${
                  (value[4]!.correct && 'bg-green-500/80') ||
                  (value[4]!.oop && 'bg-yellow-500/80')
                }`}>
                <div className='flex text-center justify-center self-center relative top-1'>
                  {(value[4] && value[4].letter) ?? '.'}
                </div>
              </div>
            </div>
          )
        })}
      <div className='relative flex gap-x-2 top-5 self-center justify-center w-full select-none'>
        <div className='inline w-10 h-10 border-2'>
          <div className='flex text-center justify-center self-center relative top-1'>
            {(words[0] && words[0].letter) ?? '.'}
          </div>
        </div>
        <div className='inline w-10 h-10 border-2'>
          <div className='flex text-center justify-center self-center relative top-1'>
            {(words[1] && words[1].letter) ?? '.'}
          </div>
        </div>
        <div className='inline w-10 h-10 border-2'>
          <div className='flex text-center justify-center self-center relative top-1'>
            {(words[2] && words[2].letter) ?? '.'}
          </div>
        </div>
        <div className='inline w-10 h-10 border-2'>
          <div className='flex text-center justify-center self-center relative top-1'>
            {(words[3] && words[3].letter) ?? '.'}
          </div>
        </div>
        <div className='inline w-10 h-10 border-2'>
          <div className='flex text-center justify-center self-center relative top-1'>
            {(words[4] && words[4].letter) ?? '.'}
          </div>
        </div>
      </div>
    </div>
  )
}
