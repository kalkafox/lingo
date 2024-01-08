import {
  fingerprintAtom,
  gameSettingsAtom,
  guessedLingoAtom,
  lingoHistoryAtom,
} from '@/util/atoms'
import { useCreateSession } from '@/util/hooks'
import { useAtom } from 'jotai'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './helpers'
import { SpringValue } from '@react-spring/web'
import { Button } from './ui/button'

export const NewGame = (lingoSpring: {
  x: SpringValue<number>
  opacity: SpringValue<number>
}) => {
  const router = useRouter()

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)

  const [gameSettings, setGameSettings] = useAtom(gameSettingsAtom)

  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)

  const [history, setHistory] = useAtom(lingoHistoryAtom)

  const createSession = useCreateSession()

  return (
    <Button
      onClick={async () => {
        //console.log(fingerprint)
        if (fingerprint && fingerprint !== '') {
          console.log('lol')
          lingoSpring.x.start(-90)
          lingoSpring.opacity.start(0)
          const res = await createSession.mutateAsync({
            fingerprint,
            settings: {
              firstLetter: true,
            },
          })
          lingoSpring.opacity.set(0)
          lingoSpring.x.set(95)
          setGuessedWords([])
          setHistory([])
          //setConfettiVisible(false)

          router.push(`/game/${res}`)
        }
      }}
      className={``}
    >
      {createSession.isLoading ? <LoadingSpinner /> : 'New game'}
    </Button>
  )
}
