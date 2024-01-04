import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import type { Char, GuessedLingoRow, Letter, LingoRow } from '@/types/lingo'
import { useAtom } from 'jotai'
import {
  fingerprintAtom,
  gameSettingsAtom,
  lingoHistoryAtom,
  lingoRowAtom,
} from '@/util/atoms'
import { trpc } from '@/util/trpc'
import { defaultChar } from '@/util/defaults'
import { useRouter } from 'next/router'
import { NewGame } from '@/components/Buttons'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const router = useRouter()
  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)
  const [gameSettings, setGameSettings] = useAtom(gameSettingsAtom)

  const createSessionQuery = trpc.createSession.useQuery(
    {
      fingerprint,
      settings: gameSettings,
    },
    {
      enabled: false,
    },
  )

  useEffect(() => {
    setFingerprint(window.localStorage.getItem('fingerprint') as string)
  }, [])

  console.log(fingerprint)

  return (
    <div className='relative'>
      <h1>Lingo (on the web!)</h1>
      <p>Work in progress</p>
      <NewGame />
    </div>
  )
}
