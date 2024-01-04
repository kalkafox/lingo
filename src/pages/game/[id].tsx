import Confetti from '@/components/Confetti'
import { GuessedLingoRow, LingoRow, LingoRows, Settings } from '@/types/lingo'
import {
  confettiVisibleAtom,
  fingerprintAtom,
  gameSettingsAtom,
  guessedLingoAtom,
  lingoHistoryAtom,
  lingoRowAtom,
} from '@/util/atoms'
import { defaultChar } from '@/util/defaults'
import { inter } from '@/util/font'
import { useCreateSession, useSessionInfo } from '@/util/hooks'
import { trpc } from '@/util/trpc'
import { useAtom } from 'jotai'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { animated, useSpring } from '@react-spring/web'
import { Icon } from '@iconify/react'
import { LoadingSpinner } from '@/components/Helpers'
import { NewGame } from '@/components/Buttons'

function Game() {
  const router = useRouter()

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)
  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)
  const [history, setHistory] = useAtom(lingoHistoryAtom)

  useEffect(() => {
    const fingerprint_local = window.localStorage.getItem('fingerprint')
    if (fingerprint_local) {
      setFingerprint(fingerprint_local)
    }
  }, [])

  const gameId = router.query.id as string
  // const [history, setHistory] = useState<LingoRows>([])

  // const [guessedWords, setGuessedWords] = useState<GuessedLingoRow>([])

  const sessionInfo = useSessionInfo({ gameId })

  return (
    <>
      <div
        className={`relative flex flex-col justify-center self-center items-center text-neutral-100 ${inter.className}`}>
        <History gameId={gameId} />
        <Input gameId={gameId} />
        <Results gameId={gameId} />
      </div>
      <Confetti finished={sessionInfo.data?.finished} />
    </>
  )
}

function useClipboardSpring() {
  return useSpring(() => ({
    y: 0,
    opacity: 0,
    display: 'none',
  }))
}

function Results({ gameId }: { gameId: string }) {
  const { status } = useSession()

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)
  const [gameSettings, setGameSettings] = useAtom(gameSettingsAtom)
  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)
  const [history, setHistory] = useAtom(lingoHistoryAtom)

  const [clipboardSpring, clipboardSpringApi] = useClipboardSpring()

  const interpolateOpacity = clipboardSpring.opacity.to(
    [0, 0.25, 0.5, 0.75, 1],
    [0, 0.5, 1, 0.5, 0],
  )

  const sessionInfo = useSessionInfo({ gameId })

  const definition = trpc.getDefinition.useQuery(
    sessionInfo.data?.word as string,
    {
      enabled: false,
    },
  )

  useEffect(() => {
    console.log(guessedWords)
    history.forEach((row) => {
      setGuessedWords(
        (prev) =>
          row.map((l, index) => {
            if (prev[index] && prev[index].correct) {
              return { letter: prev[index].letter, correct: true }
            }
            const res = l.correct
              ? { letter: l.letter, correct: true }
              : { letter: '.', correct: false }
            return res
          }) as GuessedLingoRow,
      )
    })
  }, [history])

  useEffect(() => {
    if (sessionInfo.data?.word) {
      definition.refetch()
    }
  }, [sessionInfo.data])

  const router = useRouter()

  if (
    !sessionInfo ||
    !sessionInfo.data ||
    !sessionInfo.data.finished ||
    !sessionInfo.data.word
  )
    return (
      <div
        className={`relative flex gap-x-2 my-8 self-center justify-center select-none`}>
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
    )

  return (
    <>
      <div
        className={`relative flex flex-col my-8 gap-y-2 text-center self-center justify-center items-center select-none ${inter.className}`}>
        {definition.data && definition.data[0] && (
          <div className='bg-neutral-700 p-2 rounded-lg w-80'>
            <div>
              {definition.data[0].meanings[0].definitions[0].definition}
            </div>
          </div>
        )}
        <div>
          Finished in {sessionInfo.data.finished - sessionInfo.data.created}
          ms by{' '}
          {sessionInfo.data.owner ? sessionInfo.data.owner.name : 'anonymous'}
          <animated.div
            style={{ ...clipboardSpring, opacity: interpolateOpacity }}
            className='absolute inline right-0'>
            <Icon
              className='inline -my-[0.5pt] mx-1 text-green-500'
              icon='mdi:check-bold'
              inline={true}
            />
          </animated.div>
          <button
            onClick={async () => {
              navigator.clipboard.writeText(window.location.href)
              if (clipboardSpring.y.isAnimating) {
                clipboardSpring.opacity.set(0)
                clipboardSpring.y.set(0)
              }
              clipboardSpring.display.set('inline')
              clipboardSpring.opacity.start(1)
              await clipboardSpring.y.start(-20)
              if (clipboardSpring.y.isAnimating) return
              clipboardSpring.y.set(0)
              clipboardSpring.opacity.set(0)
              clipboardSpring.display.set('none')
            }}>
            <Icon
              className='inline -my-[0.5pt] mx-1'
              icon='octicon:share-16'
              inline={true}
            />
          </button>
          {sessionInfo.data.owner && (
            <Image
              className={'inline mx-2 rounded-lg'}
              src={sessionInfo.data.owner.image!}
              width={20}
              height={20}
              alt={'owner_avatar'}
            />
          )}
        </div>
        <ClaimButton gameId={gameId} status={status} />
        <NewGame />
        {/* {!sessionInfo.data.owner &&
              sessionInfo.data.fingerprint &&
              sessionInfo.data.fingerprint === fingerprint && (
                <button
                  onClick={async () => {
                    switch (status) {
                      case 'authenticated':
                        await claimSessionQuery.refetch()
                        await sessionInfo.refetch()
                        break
                      case 'unauthenticated':
                        signIn()
                        break
                    }
                  }}
                  className='bg-neutral-700 p-2 rounded-lg'>
                  Claim it!
                </button>
              )} */}
      </div>
    </>
  )
}

function Input({ gameId }: { gameId: string }) {
  const [history, setHistory] = useAtom(lingoHistoryAtom)
  const [words, setWords] = useAtom(lingoRowAtom)
  const [borderColor, setBorderColor] = useState('')

  const guessWord = trpc.guessWord.useMutation()

  const [{ x, opacity, rotateZ }, api] = useSpring(() => ({
    from: { x: 0, opacity: 0.5, rotateZ: 0 },
  }))

  const xInterpolate = x.to(
    [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
    [0, 10, -10, 10, -10, 10, -10, 0],
  )

  const sessionInfo = useSessionInfo({ gameId })

  useEffect(() => {
    if (gameId) {
      sessionInfo.refetch()
    }
  }, [gameId])

  if (!sessionInfo.data)
    return (
      <div className='relative flex gap-x-2 top-5 self-center justify-center select-none'>
        <LoadingSpinner />
      </div>
    )

  if (sessionInfo.data.finished) return

  return (
    <animated.div
      style={{ x: xInterpolate, opacity, rotateZ }}
      className='relative flex gap-x-2 top-5 self-center justify-center select-none'>
      {Array.from({ length: sessionInfo.data.wordLength }, (_, i) => (
        <div
          key={i}
          className={`inline w-10 h-10 border-2 transition-colors ${borderColor}`}>
          <div className='flex text-center justify-center self-center relative top-1'>
            {(words[i] && words[i].letter) ?? '.'}
          </div>
        </div>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault()

          console.log(Math.random())

          if (words.length === 0) {
            await rotateZ.start(rotateZ.get() + 180)
            if (rotateZ.isAnimating) return
            rotateZ.set(rotateZ.get() % 360)
            rotateZ.start(0)
            return
          }

          const shake = async () => {
            setBorderColor('border-red-500')
            await x.start({ from: 0, to: 1 })
            if (x.isAnimating) return
            setBorderColor('border-green-500')
          }

          if (words.length < sessionInfo.data.wordLength) {
            await shake()
            return
          }

          const res = await guessWord.mutateAsync({
            id: gameId,
            word: words.map((c) => c.letter).join(''),
          })

          //console.log(res.data)

          if (
            'duplicate' in res &&
            res.duplicate &&
            'message' in res &&
            res.message
          ) {
            console.error(res.message)
          }

          if (
            res &&
            (('duplicate' in res && typeof res.duplicate === 'boolean') ||
              ('invalid' in res && typeof res.invalid === 'boolean'))
          ) {
            await shake()
            setWords([])
            return
          }

          await sessionInfo.refetch()

          if (res) {
            setHistory((prev) => {
              return [...prev, res as LingoRow]
            })
            setWords([])
          }

          if (res && 'message' in res && res.message) {
            console.error(res.message)
          }
        }}
        className='absolute opacity-0'>
        <input
          autoFocus={true}
          onFocus={(e) => {
            opacity.start(1)
            setBorderColor('border-green-500')
          }}
          onBlur={(e) => {
            opacity.start(0.5)
            setBorderColor('')
          }}
          className='h-10'
          onInput={(e) => {
            if (sessionInfo.data && sessionInfo.data.finished) {
              return
            }
            const event = e.nativeEvent as InputEvent

            if (event.inputType === 'deleteContentBackward') {
              setWords((prev) => {
                return prev.slice(0, -1) as LingoRow
              })
            }

            const key = event.data

            if (
              key &&
              event.inputType === 'insertText' &&
              words.length < sessionInfo.data.wordLength
            ) {
              const isAlphabetical = /^[a-zA-Z]$/.test(key)
              if (isAlphabetical) {
                setWords((prev) => {
                  return [
                    ...prev,
                    {
                      ...defaultChar,
                      letter: key.toUpperCase(),
                    },
                  ] as LingoRow
                })
              }
            }
          }}
          type='text'></input>
      </form>
    </animated.div>
  )
}

function History({ gameId }: { gameId: string }) {
  const [history, setHistory] = useAtom(lingoHistoryAtom)

  const sessionInfo = useSessionInfo({ gameId })

  useEffect(() => {
    if (sessionInfo.data) {
      setHistory(sessionInfo.data.history as LingoRows)
    }
  }, [sessionInfo.data])

  return history.map((value, index, array) => (
    <div
      key={index}
      className={`relative flex gap-x-2 py-1 self-center justify-center select-none`}>
      {value.map((v, index) => {
        return (
          <div
            key={index}
            className={`inline w-10 h-10 border-2 ${
              (v.correct && 'bg-green-500/80') ||
              (v.oop && 'bg-yellow-500/80') ||
              (v.invalid && 'bg-neutral-500')
            }`}>
            <div className='flex text-center justify-center self-center relative top-1'>
              {(v && v.letter) ?? '.'}
            </div>
          </div>
        )
      })}
    </div>
  ))
}

function ClaimButton({
  gameId,
  status,
}: {
  gameId: string
  status: 'authenticated' | 'unauthenticated' | 'loading'
}) {
  const claimSessionQuery = trpc.claimSession.useQuery(gameId, {
    enabled: false,
  })

  return (
    <button
      onClick={async () => {
        switch (status) {
          case 'authenticated':
            await claimSessionQuery.refetch()
            break
          case 'unauthenticated':
            signIn()
            break
        }
      }}
      className='bg-neutral-700 p-2 rounded-lg'>
      Claim it!
    </button>
  )
}

export default Game
