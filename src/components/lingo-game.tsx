import {
  GuessedChar,
  GuessedLingoRow,
  LingoRow,
  LingoRows,
  LingoState,
} from '@/types/lingo'
import {
  fingerprintAtom,
  gameAtom,
  guessedLingoAtom,
  lingoHistoryAtom,
  windowSizeAtom,
  wordInputAtom,
} from '@/util/atoms'
import { inter } from '@/util/font'
import useIsTouchDevice, {
  useCreateSession,
  useSessionInfo,
} from '@/util/hooks'
import { trpc } from '@/util/trpc'
import { Icon } from '@iconify/react'
import { useSpring, animated, SpringValue } from '@react-spring/web'
import { useAtom, useAtomValue } from 'jotai'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { NewGame } from './buttons'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { SessionList } from './session-list'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

export function LingoGame() {
  const sessionInfo = useSessionInfo()

  const [lingoSpring, lingoSpringApi] = useSpring(() => ({
    from: {
      x: 95,
      opacity: 0,
    },
  }))

  const [game, setGame] = useAtom(gameAtom)

  const router = useRouter()

  useEffect(() => {
    if (!router.query.id) return

    setGame({ ...game, gameId: router.query.id as string })
  }, [router.query.id])

  useEffect(() => {
    if (!game.gameId) return

    sessionInfo.refetch().then(() => {
      lingoSpring.x.start(0)
      lingoSpring.opacity.start(1)
    })
  }, [game.gameId])

  useEffect(() => {
    setGame((prev: LingoState) => ({
      ...prev,
      active: sessionInfo.data?.finished ? false : true,
    }))
  }, [sessionInfo.data])

  // useEffect(() => {
  //   if (
  //     createSession.isLoading ||
  //     sessionInfo.isFetching ||
  //     sessionInfo.isRefetching
  //   ) {
  //     lingoSpring.x.start(-90)
  //   } else {
  //     lingoSpring.x.start(0)
  //   }
  // }, [createSession, sessionInfo])

  useEffect(() => {
    if (
      sessionInfo.data &&
      router.asPath.split('/').slice(-1)[0] !== sessionInfo.data.id
    )
      return

    if (!sessionInfo.data) return
    console.log(router.asPath.split('/').slice(-1)[0])

    // if (lingoSpring.x.get() === 0 && lingoSpring.opacity.get() === 1) return

    // if (lingoSpring.x.isAnimating && Math.abs(lingoSpring.x.get()) <= 1) return

    lingoSpring.opacity.set(0)
    lingoSpring.x.set(-95)

    if (sessionInfo.isRefetching || sessionInfo.isFetching) return

    lingoSpring.opacity.start(1)
    lingoSpring.x.start(0)
  }, [sessionInfo, router.asPath, lingoSpring])

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
        <Results lingoSpring={lingoSpring} />
      </animated.div>
      <div className="fixed top-0">
        <SessionList lingoSpring={lingoSpring} />
      </div>
    </>
  )
}

function useClipboardSpring() {
  const clipboardSpring = useSpring({ y: 0, opacity: 0, display: 'none' })
  const interpolateClipboardOpacity = clipboardSpring.opacity.to(
    [0, 0.25, 0.5, 0.75, 1],
    [0, 0.5, 1, 0.5, 0],
  )

  const animateClipboard = async () => {
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
  }

  return { clipboardSpring, interpolateClipboardOpacity, animateClipboard }
}

function Results({
  lingoSpring,
}: {
  lingoSpring: { x: SpringValue<number>; opacity: SpringValue<number> }
}) {
  const { status } = useSession()
  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)
  const [history, setHistory] = useAtom(lingoHistoryAtom)
  const { clipboardSpring, interpolateClipboardOpacity, animateClipboard } =
    useClipboardSpring()

  const sessionInfo = useSessionInfo()

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

  useEffect(() => {
    if (
      guessedWords.filter((c) => c.correct).length >=
      sessionInfo.data?.wordLength!
    ) {
      sessionInfo.refetch()
    }
  }, [guessedWords])

  const router = useRouter()

  console.log(guessedWords.filter((c) => c.correct).length)

  if (guessedWords.filter((c) => c.correct).length <= 1) return

  if (
    !sessionInfo ||
    !sessionInfo.data ||
    !sessionInfo.data.finished ||
    !sessionInfo.data.word
  )
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
        className={`my-8 flex select-none flex-col items-center justify-center gap-y-2 self-center text-center ${inter.className}`}
      >
        {/* {definition.data && definition.data[0] && (
          <div className="rounded-lg bg-neutral-200/80 p-2 dark:bg-neutral-900/80">
            <div className="w-80">
              {definition.data[0].meanings[0].definitions[0].definition}
            </div>
          </div>
        )} */}
        <div className="rounded-lg bg-neutral-200/80 p-2 dark:bg-neutral-900/80">
          <div className="">
            Finished in {sessionInfo.data.finished - sessionInfo.data.created}
            ms by{' '}
            {sessionInfo.data.owner ? sessionInfo.data.owner.name : 'anonymous'}
            <animated.div
              style={{
                ...clipboardSpring,
                opacity: interpolateClipboardOpacity,
              }}
              className="absolute inline"
            >
              <Icon
                className="-my-[0.5pt] mx-1 inline text-green-500"
                icon="mdi:check-bold"
                inline={true}
              />
            </animated.div>
            {sessionInfo.data.owner && (
              <Image
                className={'mx-2 inline rounded-lg'}
                src={sessionInfo.data.owner.image!}
                width={20}
                height={20}
                alt={'owner_avatar'}
              />
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <button className="" onClick={animateClipboard}>
                    <Icon
                      className="-my-[0.5pt] mx-1 inline rounded-sm transition-colors hover:bg-neutral-100/20"
                      icon="ph:copy-bold"
                      inline={true}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex justify-center gap-x-2">
            <ClaimButton status={status} />
            <NewGame opacity={lingoSpring.opacity} x={lingoSpring.x} />
          </div>
        </div>
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

function Input() {
  const [history, setHistory] = useAtom(lingoHistoryAtom)
  const [words, setWords] = useAtom(wordInputAtom)
  const [game, setGameAtom] = useAtom(gameAtom)
  const [borderColor, setBorderColor] = useState('')

  const isMobile = useIsTouchDevice()

  const inputRef = useRef<HTMLInputElement>(null)

  const guessWord = trpc.guessWord.useMutation()

  const [{ x, opacity, rotateZ }, api] = useSpring(() => ({
    from: { x: 0, opacity: 0.5, rotateZ: 0 },
  }))

  const xInterpolate = x.to(
    [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
    [0, 10, -10, 10, -10, 10, -10, 0],
  )

  const sessionInfo = useSessionInfo()

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
            className={`inline h-10 w-10 border-2 backdrop-blur-sm transition-colors ${borderColor}`}
          >
            <div className="relative top-1 flex justify-center self-center text-center">
              {(wordsSeparated &&
                wordsSeparated[i] &&
                wordsSeparated[i].toUpperCase()) ??
                '.'}
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
            await x.start({ from: 0, to: 1 })
            if (x.isAnimating) return
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
            if (sessionInfo.data && sessionInfo.data.finished) {
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
      key={index}
      className={`relative flex select-none justify-center gap-x-2 self-center py-1`}
    >
      {value.map((v, index) => {
        return (
          <div
            key={index}
            className={`inline h-10 w-10 border-2 border-neutral-900 dark:border-neutral-800 ${
              (v.correct && 'bg-green-500/80') ||
              (v.oop && 'bg-yellow-500/80') ||
              (v.invalid && 'bg-neutral-500/80') ||
              (!v.invalid &&
                !v.correct &&
                !v.oop &&
                'bg-neutral-300/80 dark:bg-neutral-900/20')
            }`}
          >
            <div className="relative top-1 flex justify-center self-center text-center">
              {(v && v.letter) ?? '.'}
            </div>
          </div>
        )
      })}
    </div>
  ))
}

function ClaimButton({
  status,
}: {
  status: 'authenticated' | 'unauthenticated' | 'loading'
}) {
  const [{ gameId }] = useAtom(gameAtom)
  const claimSessionMutation = trpc.claimSession.useMutation()

  if (!gameId) return

  return (
    <Button
      onClick={async () => {
        switch (status) {
          case 'authenticated':
            await claimSessionMutation.mutateAsync(gameId)
            break
          case 'unauthenticated':
            signIn()
            break
        }
      }}
    >
      Claim it!
    </Button>
  )
}
