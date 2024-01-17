import { GuessedLingoRow, LingoRow, LingoRows, LingoState } from '@/types/lingo'
import {
  gameAtom,
  guessedLingoAtom,
  lingoHistoryAtom,
  wordInputAtom,
} from '@/util/atoms'
import { LEFT_X } from '@/util/constants'
import { inter } from '@/util/font'
import { calculateTime } from '@/util/helpers'
import useIsTouchDevice, { useSessionInfo } from '@/util/hooks'
import { useLingoSpring } from '@/util/springs'
import { trpc } from '@/util/trpc'
import { Icon } from '@iconify/react'
import { animated, useSpring } from '@react-spring/web'
import { useAction } from 'convex/react'
import { useAtom } from 'jotai'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import { ClaimButton, CopyButton, NewGame } from './buttons'
import { TimestampTooltip } from './helpers'
import { SessionList } from './session-list'

export function LingoGame() {
  const sessionInfo = useSessionInfo()

  const { lingoSpring, lingoSpringApi } = useLingoSpring()

  const session = useSession()

  const [game, setGame] = useAtom(gameAtom)

  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)

  const router = useRouter()

  const notifySession = useAction(api.functions.verifyAndMutateSession)

  useEffect(() => {
    if (!router.query.id) return

    setGame((prev) => ({ ...prev, gameId: router.query.id as string }))
  }, [router.query.id])

  useEffect(() => {
    if (!game.gameId) return

    sessionInfo.refetch().then(() => {
      lingoSpringApi.set({
        x: LEFT_X,
        opacity: 0,
      })

      lingoSpringApi.start({
        x: 0,
        opacity: 1,
      })
    })
  }, [game.gameId])

  useEffect(() => {
    setGame((prev: LingoState) => ({
      ...prev,
      active: !sessionInfo.data?.finished,
    }))
  }, [sessionInfo.data])

  return (
    <>
      <animated.div
        onChange={(e) => {
          console.log('ya')
          // todo: write a function that determines the width based on the length of the word
        }}
        style={lingoSpring}
        className={`absolute left-0 right-0 m-auto w-96 ${inter.className}`}
      >
        <History />
        <Input />
        <Results />
      </animated.div>
      <div className="fixed top-0">
        <SessionList lingoSpring={lingoSpring} />
      </div>
    </>
  )
}

function Results() {
  const { status } = useSession()
  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)
  const [history, setHistory] = useAtom(lingoHistoryAtom)

  const router = useRouter()

  const sessionInfo = useSessionInfo()

  useEffect(() => {
    setGuessedWords([])
    history.forEach((row) => {
      setGuessedWords(
        (prev) =>
          row.map((l, index) => {
            if (prev[index]?.correct) {
              return { letter: prev[index].letter, correct: true }
            }
            const res = l.correct
              ? { letter: l.letter, correct: true }
              : { letter: '.', correct: false }
            return res
          }) as GuessedLingoRow,
      )
    })
  }, [history, router.asPath])

  if (guessedWords.filter((c) => c.correct).length <= 1) return

  if (!sessionInfo.data?.word)
    return (
      <div
        className={`relative my-8 flex select-none justify-center gap-x-2 self-center`}
      >
        {guessedWords.map((value, index, array) => {
          return (
            <div
              key={index}
              className={`inline h-10 w-10 border-2 border-neutral-300 backdrop-blur-sm ${
                !value.correct && ''
              } ${value.correct && 'bg-green-500/80'}`}
            >
              <div className="relative top-1 flex justify-center self-center text-center">
                {value?.letter ?? '.'}
              </div>
            </div>
          )
        })}
      </div>
    )

  if (!sessionInfo.data.finished) return

  return (
    <div
      className={`my-8 flex select-none flex-col items-center justify-center gap-y-2 self-center text-center ${inter.className}`}
    >
      <div className="rounded-lg bg-neutral-200/80 p-2 dark:bg-neutral-900/80">
        <div className="flex-col items-center p-2">
          <div className="flex items-center gap-x-1">
            <Icon icon="mdi:clock" />
            <TimestampTooltip
              created={sessionInfo.data.created}
              finished={sessionInfo.data.finished}
            >
              Took{' '}
              {calculateTime(
                sessionInfo.data.finished - sessionInfo.data.created,
              )}{' '}
              ({calculateTime(Date.now() - sessionInfo.data.created)} ago)
            </TimestampTooltip>
            <CopyButton />
          </div>
          <div className="flex items-center gap-x-1">
            <Icon icon="mdi:user-outline" />
            <div>
              {sessionInfo.data.owner
                ? sessionInfo.data.owner.name
                : 'anonymous'}
            </div>
            {sessionInfo.data.owner && (
              <Image
                className={'mx-1 inline rounded-lg'}
                src={sessionInfo.data.owner.image!}
                width={20}
                height={20}
                alt={'owner_avatar'}
              />
            )}
          </div>
        </div>
        <div className="flex justify-center gap-x-2">
          <ClaimButton status={status} />
          <NewGame />
        </div>
      </div>
    </div>
  )
}

function Input() {
  const [history, setHistory] = useAtom(lingoHistoryAtom)
  const [words, setWords] = useAtom(wordInputAtom)
  const [game, setGameAtom] = useAtom(gameAtom)
  const [borderColor, setBorderColor] = useState('')

  const [checkResults, setCheckResults] = useState(false)

  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)

  const session = useSession()

  const notifySession = useAction(api.functions.verifyAndMutateSession)

  const isMobile = useIsTouchDevice()

  const inputRef = useRef<HTMLInputElement>(null)

  const guessWord = trpc.guessWord.useMutation()

  const [{ rotateX, opacity, rotateZ }, springApi] = useSpring(() => ({
    from: { rotateX: 0, opacity: 0.5, rotateZ: 0 },
  }))

  const xInterpolate = rotateX.to(
    [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
    [0, 10, -10, 10, -10, 10, -10, 0],
  )

  const sessionInfo = useSessionInfo()

  useEffect(() => {
    if (sessionInfo.data?.word) {
      //definition.refetch()
    }
  }, [sessionInfo.data])

  useEffect(() => {
    if (
      guessedWords.filter((c) => c.correct).length >=
        sessionInfo.data?.wordLength! &&
      checkResults
    ) {
      notifySession({
        sessionId: sessionInfo.data?.id!,
        token: session.data?.user.token!,
      })
      sessionInfo.refetch()
      setCheckResults(false)
    }
  }, [guessedWords, checkResults])

  console.log(guessedWords.filter((c) => c.correct).length)

  // ridiculously stupid dumb hack for android
  useEffect(() => {
    if (!isMobile) return

    const interval = setInterval(() => {
      const current = inputRef.current
      if (!current) return

      let word = inputRef.current.value
      word = word.replace(/[^a-zA-Z]/g, '').toUpperCase()

      inputRef.current.value = word

      console.log(word)

      if (word === words) return
      setWords(word)
    }, 80)

    return () => {
      clearInterval(interval)
    }
  }, [isMobile])

  if (!sessionInfo.data) return
  if (sessionInfo.data.finished || !game.gameId) return

  return (
    <animated.div
      style={{ x: xInterpolate, rotateZ }}
      className="relative flex select-none justify-center gap-x-2 self-center "
    >
      {Array.from({ length: sessionInfo.data.wordLength }, (_, i) => {
        const wordsSeparated = inputRef.current?.value.split('')

        return (
          <div
            key={i}
            className={`flex h-10 w-10 items-center justify-center backdrop-blur-sm self-center border-2 transition-colors ${borderColor}`}
          >
            <div className="">
              {(wordsSeparated && wordsSeparated[i]?.toUpperCase()) ?? '.'}
            </div>
          </div>
        )
      })}
      <form
        onSubmit={async (e) => {
          e.preventDefault()

          if (!inputRef.current) return

          console.log(Math.random())

          if (inputRef.current.value.length === 0) {
            await rotateZ.start(rotateZ.get() + 180)
            if (rotateZ.isAnimating) return
            rotateZ.set(rotateZ.get() % 360)
            rotateZ.start(0)
            return
          }

          const shake = async () => {
            setBorderColor('border-red-500')
            await rotateX.start({ from: 0, to: 1 })
            if (rotateX.isAnimating) return
            setBorderColor('border-green-500')
          }

          if (
            inputRef.current?.value.split('').length <
            sessionInfo.data.wordLength
          ) {
            await shake()
            return
          }

          const res = await guessWord.mutateAsync({
            id: game.gameId as string,
            word: inputRef.current.value,
          })

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
            if ('duplicate' in res && res.duplicate) {
              toast.error('Word already guessed. Try another!')
            }

            if ('invalid' in res && res.invalid) {
              toast.error('Word not found in dictionary, sorry.')
            }

            await shake()
            setWords('')
            inputRef.current.value = ''
            return
          }

          //await sessionInfo.refetch()

          if (res) {
            setHistory((prev) => {
              return [...prev, res as LingoRow]
            })
            inputRef.current.value = ''
            setWords('')
            setCheckResults(true)
          }

          if (res && 'message' in res && res.message) {
            console.error(res.message)
          }
        }}
        className="absolute opacity-0"
      >
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
          className="h-10"
          ref={inputRef}
          onChange={(e) => {
            console.log(e)
            if (sessionInfo.data?.finished) {
              return
            }
            const event = e.nativeEvent as InputEvent

            if (event.inputType === 'deleteContentBackward') {
              setWords(inputRef.current?.value!)
            }

            const key = event.data

            if (
              key &&
              event.inputType === 'insertText' &&
              words.length < sessionInfo.data.wordLength
            ) {
              const isAlphabetical = /^[a-zA-Z]$/.test(key)
              if (isAlphabetical) {
                setWords(inputRef.current?.value!)
              }
            }
          }}
          type="text"
        ></input>
      </form>
    </animated.div>
  )
}

function History() {
  const [history, setHistory] = useAtom(lingoHistoryAtom)

  const sessionInfo = useSessionInfo()

  useEffect(() => {
    if (sessionInfo.data) {
      setHistory(sessionInfo.data.history as LingoRows)
    }
  }, [sessionInfo.data])

  return history.map((value, index, array) => (
    <div
      // deal with later if it becomes a problem
      key={index}
      className={`relative flex select-none justify-center gap-x-2 self-center py-1`}
    >
      {value.map((v, index) => {
        return (
          <div
            key={index}
            className={`flex h-10 w-10 items-center justify-center  border-2 border-neutral-900 dark:border-neutral-800 ${
              (v.correct && 'bg-green-500/80') ||
              (v.oop && 'bg-yellow-500/80') ||
              (v.invalid && 'bg-neutral-500/80') ||
              (!v.invalid &&
                !v.correct &&
                !v.oop &&
                'bg-neutral-300/80 dark:bg-neutral-900/20')
            }`}
          >
            <div className="">{v.letter ?? '.'}</div>
          </div>
        )
      })}
    </div>
  ))
}
