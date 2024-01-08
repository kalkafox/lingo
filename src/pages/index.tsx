import { Inter } from 'next/font/google'
import { useAtom } from 'jotai'
import { fingerprintAtom, gameSettingsAtom } from '@/util/atoms'
import { trpc } from '@/util/trpc'
import { useRouter } from 'next/router'
import Markdown from 'react-markdown'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const router = useRouter()
  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)
  const [gameSettings, setGameSettings] = useAtom(gameSettingsAtom)

  const createSessionQuery = trpc.createSession.useMutation()

  console.log(fingerprint)

  const markdown = `
  # hi!
  `

  return (
    <div className="relative">
      <Markdown>{markdown}</Markdown>
    </div>
  )
}
