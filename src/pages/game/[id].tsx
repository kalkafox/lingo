import Confetti from '@/components/Confetti'
import { GuessedLingoRow, LingoRow, LingoRows } from '@/types/lingo'
import {
  confettiVisibleAtom,
  fingerprintAtom,
  lingoHistoryAtom,
  lingoRowAtom,
} from '@/util/atoms'
import { defaultChar } from '@/util/defaults'
import { inter } from '@/util/font'
import { trpc } from '@/util/trpc'
import { useAtom, useAtomValue } from 'jotai'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

function Game() {
  const router = useRouter()

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)

  const [confettiVisible, setConfettiVisible] = useAtom(confettiVisibleAtom)

  useEffect(() => {
    const fingerprint_local = window.localStorage.getItem('fingerprint')
    if (fingerprint_local) {
      setFingerprint(fingerprint_local)
    }
  }, [])

  const { status } = useSession()

  const gameId = router.query.id as string
  const [history, setHistory] = useState<LingoRows>([])
  const [words, setWords] = useAtom(lingoRowAtom)

  const [guessedWords, setGuessedWords] = useState<GuessedLingoRow>([])

  const claimSessionQuery = trpc.claimSession.useQuery(gameId, {
    enabled: false,
  })

  const sessionInfoQuery = trpc.getSessionInfo.useQuery(
    {
      id: gameId,
    },
    { enabled: false },
  )

  const createSessionQuery = trpc.createSession.useQuery(fingerprint, {
    enabled: false,
  })

  useEffect(() => {
    console.log(fingerprint)
  }, [fingerprint])

  useEffect(() => {
    if (router.query.id) {
      sessionInfoQuery.refetch()
    }
  }, [router.query])

  const pingQuery = trpc.ping.useQuery(null, { refetchInterval: 3000 })

  const guessWordQuery = trpc.guessWord.useQuery(
    { word: words.map((c) => c.letter).join(''), id: gameId ? gameId : '' },
    {
      refetchOnMount: false,
      enabled: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  useEffect(() => {
    console.log(history)
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
    if (
      sessionInfoQuery.data &&
      'history' in sessionInfoQuery.data &&
      typeof sessionInfoQuery.data.history === 'object' &&
      sessionInfoQuery.data.history &&
      Array.isArray(sessionInfoQuery.data.history) &&
      sessionInfoQuery.data.history.length >= 0
    ) {
      console.log(sessionInfoQuery.data)
      setHistory((prev) => sessionInfoQuery.data.history as LingoRows)
    }

    if (sessionInfoQuery.data && sessionInfoQuery.data.finished) {
      const now = Date.now()

      console.log(now - sessionInfoQuery.data.finished)

      if (now - sessionInfoQuery.data.finished <= 5000) {
        setConfettiVisible(true)
      }
    }
  }, [sessionInfoQuery.data])

  return (
    <>
      <div
        className={`absolute w-full h-full ${inter.className}`}
        tabIndex={0}
        onKeyDown={async (e) => {
          if (sessionInfoQuery.data && sessionInfoQuery.data.finished) {
            return
          }
          if (e.key === 'Backspace') {
            setWords((prev) => {
              return prev.slice(0, -1) as LingoRow
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
            const res = await guessWordQuery.refetch()

            console.log(res.data)

            if (
              res.data &&
              'duplicate' in res.data &&
              typeof res.data.duplicate === 'boolean'
            ) {
              console.error('Duplicate word. Try another one!')
              setWords([])
              return
            }

            await sessionInfoQuery.refetch()

            if (!res.error && res.data) {
              setHistory((prev) => {
                return [...prev, res.data as LingoRow]
              })
              setWords([])
            }

            if (res.data && 'message' in res.data && res.data.message) {
              console.error(res.data.message)
            }
          }
        }}>
        {history &&
          history.map((value, index, array) => {
            return (
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
                        (v.invalid && 'bg-gray-500')
                      }`}>
                      <div className='flex text-center justify-center self-center relative top-1'>
                        {(v && v.letter) ?? '.'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        {sessionInfoQuery.data && !sessionInfoQuery.data.finished && (
          <div className='relative flex gap-x-2 top-5 self-center justify-center select-none'>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className='inline w-10 h-10 border-2'>
                <div className='flex text-center justify-center self-center relative top-1'>
                  {(words[i] && words[i].letter) ?? '.'}
                </div>
              </div>
            ))}
          </div>
        )}
        <div
          className={`relative flex gap-x-2 py-10 self-center justify-center select-none`}>
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
        {sessionInfoQuery.data && sessionInfoQuery.data.finished ? (
          <div
            className={`relative flex flex-col gap-y-2 text-center self-center justify-center items-center select-none ${inter.className}`}>
            <div>
              Finished in{' '}
              {sessionInfoQuery.data.finished - sessionInfoQuery.data.created}ms
              by{' '}
              {sessionInfoQuery.data.owner
                ? sessionInfoQuery.data.owner.name
                : 'anonymous'}
              {sessionInfoQuery.data.owner && (
                <Image
                  className={'inline mx-2 rounded-lg'}
                  src={sessionInfoQuery.data.owner.image!}
                  width={20}
                  height={20}
                  alt={'owner_avatar'}
                />
              )}
            </div>
            <div className='relative w-16 h-16'>
              <div className='absolute inset-0 rounded-full bg-gray-200'></div>
              <div className='absolute inset-0 rounded-full mask-conver bg-gradient-to-b from-transparent via-transparent to-gray-200'></div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-gray-600 text-lg font-bold'>75%</span>
              </div>
            </div>
            {!sessionInfoQuery.data.owner &&
              sessionInfoQuery.data.fingerprint &&
              sessionInfoQuery.data.fingerprint === fingerprint && (
                <div>
                  <button
                    onClick={async () => {
                      switch (status) {
                        case 'authenticated':
                          await claimSessionQuery.refetch()
                          await sessionInfoQuery.refetch()
                          break
                        case 'unauthenticated':
                          signIn()
                          break
                      }
                    }}
                    className='bg-gray-900 p-2 rounded-lg'>
                    Claim it!
                  </button>
                </div>
              )}
            <div>
              <button
                onClick={async () => {
                  console.log(fingerprint)
                  if (fingerprint && fingerprint !== '') {
                    const res = await createSessionQuery.refetch()
                    setGuessedWords([])
                    setHistory([])
                    setConfettiVisible(false)

                    router.push(`/game/${res.data}`)
                  }
                }}
                className={`bg-gray-900 p-2 rounded-lg`}>
                <div
                  className={`${
                    createSessionQuery.isLoading ?? 'animate-spin'
                  }`}></div>
                {createSessionQuery.isLoading ? '' : 'Start new game'}
              </button>
            </div>
          </div>
        ) : (
          <></>
        )}
        <div>
          <div
            className={`w-5 h-5 ${
              pingQuery.isError && pingQuery.error
                ? 'bg-red-500'
                : pingQuery.isRefetching || pingQuery.isLoading
                ? 'bg-yellow-500'
                : pingQuery.isSuccess
                ? 'bg-green-500'
                : 'bg-gray-500'
            } fixed bottom-0 m-2 rounded-full`}></div>
        </div>
      </div>
      {confettiVisible && <Confetti />}
    </>
  )
}

export default Game
