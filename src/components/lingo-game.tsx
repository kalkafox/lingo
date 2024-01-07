import { GuessedLingoRow, LingoRow, LingoRows, LingoState } from '@/types/lingo'
import {
  gameAtom,
  guessedLingoAtom,
  lingoHistoryAtom,
  wordInputAtom,
} from '@/util/atoms'
import { inter } from '@/util/font'
import { useCreateSession, useSessionInfo } from '@/util/hooks'
import { trpc } from '@/util/trpc'
import { Icon } from '@iconify/react'
import { useSpring, animated, SpringValue } from '@react-spring/web'
import { useAtom } from 'jotai'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { NewGame } from './buttons'
import Image from 'next/image'
import { toast } from 'sonner'

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

  const createSession = useCreateSession()

  useEffect(() => {
    if (!router.query.id) return

    setGame({ ...game, gameId: router.query.id as string })
  }, [router.query.id])

  useEffect(() => {
    if (!game.gameId) return

    sessionInfo.refetch()
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
    if (sessionInfo.data) {
      lingoSpring.opacity.start(1)
      lingoSpring.x.start(0)
    }
  }, [sessionInfo])

  return (
    <animated.div
      style={lingoSpring}
      className={`${
        Math.abs(lingoSpring.x.get()) > 0 ? 'fixed' : 'absolute'
      } left-0 right-0 text-neutral-100 ${inter.className}`}>
      <History />
      <Input />
      <Results lingoSpring={lingoSpring} />
    </animated.div>
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
      guessedWords.map((c) => c.correct).length >= sessionInfo.data?.wordLength!
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
        className={`relative flex gap-x-2 my-8 self-center justify-center select-none`}>
        {guessedWords.map((value, index, array) => {
          return (
            <div
              key={index}
              className={`inline w-10 h-10 border-2 ${
                !value.correct && 'bg-neutral-900'
              } ${value.correct && 'bg-green-500/80'}`}>
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
          <div className='bg-neutral-700/50 p-2 rounded-lg'>
            <div className='w-80'>
              {definition.data[0].meanings[0].definitions[0].definition}
            </div>
          </div>
        )}
        <div className=''>
          Finished in {sessionInfo.data.finished - sessionInfo.data.created}
          ms by{' '}
          {sessionInfo.data.owner ? sessionInfo.data.owner.name : 'anonymous'}
          <animated.div
            style={{
              ...clipboardSpring,
              opacity: interpolateClipboardOpacity,
            }}
            className='absolute inline right-0'>
            <Icon
              className='inline -my-[0.5pt] mx-1 text-green-500'
              icon='mdi:check-bold'
              inline={true}
            />
          </animated.div>
          {sessionInfo.data.owner && (
            <Image
              className={'inline mx-2 rounded-lg'}
              src={sessionInfo.data.owner.image!}
              width={20}
              height={20}
              alt={'owner_avatar'}
            />
          )}
          <button className='' onClick={animateClipboard}>
            <Icon
              className='inline hover:bg-neutral-100/20 transition-colors rounded-sm -my-[0.5pt] mx-1'
              icon='ph:copy-bold'
              inline={true}
            />
          </button>
        </div>
        <div className='gap-x-2 flex justify-center'>
          <ClaimButton status={status} />
          <NewGame opacity={lingoSpring.opacity} x={lingoSpring.x} />
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

  useEffect(() => {
    if (game.gameId) {
      sessionInfo.refetch()
    }
  }, [game.gameId])

  // ridiculously stupid dumb hack for android
  useEffect(() => {
    const interval = setInterval(() => {
      const current = inputRef.current
      if (!current) return

      let word = inputRef.current.value
      word = word.replace(/[^a-zA-Z]/g, '').toUpperCase()

      inputRef.current.value = word

      if (word === words) return
      setWords(word)
    }, 80)

    return () => {
      clearInterval(interval)
    }
  }, [words])

  if (!sessionInfo.data) return
  if (sessionInfo.data.finished || !game.gameId) return

  return (
    <animated.div
      style={{ x: xInterpolate, opacity, rotateZ }}
      className='relative flex gap-x-2 top-5 self-center justify-center select-none'>
      {Array.from({ length: sessionInfo.data.wordLength }, (_, i) => {
        const wordsSeparated = inputRef.current?.value.split('')

        return (
          <div
            key={i}
            className={`inline w-10 h-10 border-2 transition-colors bg-neutral-900/80 ${borderColor}`}>
            <div className='flex text-center justify-center self-center relative top-1'>
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
          ref={inputRef}
          // onChange={(e) => {
          //   console.log(e)
          //   if (sessionInfo.data && sessionInfo.data.finished) {
          //     return
          //   }
          //   const event = e.nativeEvent as InputEvent

          //   if (event.inputType === 'deleteContentBackward') {
          //     setWords(inputRef.current?.value!)
          //   }

          //   const key = event.data

          //   if (
          //     key &&
          //     event.inputType === 'insertText' &&
          //     words.length < sessionInfo.data.wordLength
          //   ) {
          //     const isAlphabetical = /^[a-zA-Z]$/.test(key)
          //     if (isAlphabetical) {
          //       setWords(inputRef.current?.value!)
          //     }
          //   }
          // }}
          type='text'></input>
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
      className={`relative flex gap-x-2 py-1 self-center justify-center select-none`}>
      {value.map((v, index) => {
        return (
          <div
            key={index}
            className={`inline w-10 h-10 border-2 ${
              (v.correct && 'bg-green-500/80') ||
              (v.oop && 'bg-yellow-500/80') ||
              (v.invalid && 'bg-neutral-500/80') ||
              (!v.invalid && !v.correct && !v.oop && 'bg-neutral-900/80')
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
  status,
}: {
  status: 'authenticated' | 'unauthenticated' | 'loading'
}) {
  const [{ gameId }] = useAtom(gameAtom)
  const claimSessionMutation = trpc.claimSession.useMutation()

  if (!gameId) return

  return (
    <button
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
      className='bg-neutral-700 p-2 rounded-lg'>
      Claim it!
    </button>
  )
}
