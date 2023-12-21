import { Inter } from 'next/font/google'
import { useState } from 'react'
import type { Char, GuessedLingoRow, Letter, LingoRow } from '@/types/lingo'
import { useAtom } from 'jotai'
import { lingoHistoryAtom, lingoRowAtom } from '@/util/atoms'
import { trpc } from '@/util/trpc'
import { defaultChar } from '@/util/defaults'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return <></>
}
