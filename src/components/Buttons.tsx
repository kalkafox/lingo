import {
  fingerprintAtom,
  gameSettingsAtom,
  guessedLingoAtom,
  lingoHistoryAtom,
} from '@/util/atoms'
import { useCreateSession } from '@/util/hooks'
import { useAtom } from 'jotai'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './Helpers'

export const NewGame = () => {
  const router = useRouter()

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)

  const [gameSettings, setGameSettings] = useAtom(gameSettingsAtom)

  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)

  const [history, setHistory] = useAtom(lingoHistoryAtom)

  const createSession = useCreateSession({ fingerprint, gameSettings })

  return (
    <button
      onClick={async () => {
        //console.log(fingerprint)
        if (fingerprint && fingerprint !== '') {
          console.log('lol')
          const res = await createSession.refetch()
          setGuessedWords([])
          setHistory([])
          //setConfettiVisible(false)

          router.push(`/game/${res.data}`)
        }
      }}
      className={`bg-neutral-700 p-2 rounded-lg`}>
      {createSession.isRefetching || createSession.isFetching ? (
        <LoadingSpinner />
      ) : (
        'Start new game'
      )}
    </button>
  )
}
