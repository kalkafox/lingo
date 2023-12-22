import Confetti from '@/components/Confetti'
import { GuessedLingoRow, LingoRow, LingoRows } from '@/types/lingo'
import {
  confettiVisibleAtom,
  fingerprintAtom,
  gameSettingsAtom,
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
  const [gameSettings, setGameSettings] = useAtom(gameSettingsAtom)
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

  const [solvedWord, setSolvedWord] = useState('')

  const definitionQuery = trpc.getDefinition.useQuery(solvedWord, {
    enabled: false,
  })

  const claimSessionQuery = trpc.claimSession.useQuery(gameId, {
    enabled: false,
  })

  const sessionInfoQuery = trpc.getSessionInfo.useQuery(
    {
      id: gameId,
    },
    { enabled: false },
  )

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
    //console.log(fingerprint)
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
    if (solvedWord.length > 0) {
      definitionQuery.refetch()
    }
  }, [solvedWord])

  useEffect(() => {
    if (guessedWords && guessedWords.filter((c) => c.correct).length === 5) {
      setSolvedWord(guessedWords.map((c) => c.letter).join(''))
    }
  }, [guessedWords])

  useEffect(() => {
    console.log(definitionQuery.data)
  }, [definitionQuery.data])

  useEffect(() => {
    if (
      sessionInfoQuery.data &&
      'history' in sessionInfoQuery.data &&
      typeof sessionInfoQuery.data.history === 'object' &&
      sessionInfoQuery.data.history &&
      Array.isArray(sessionInfoQuery.data.history) &&
      sessionInfoQuery.data.history.length >= 0
    ) {
      //console.log(sessionInfoQuery.data)
      setHistory((prev) => sessionInfoQuery.data.history as LingoRows)
    }

    if (sessionInfoQuery.data && sessionInfoQuery.data.finished) {
      const now = Date.now()

      //console.log(now - sessionInfoQuery.data.finished)

      if (now - sessionInfoQuery.data.finished <= 5000) {
        setConfettiVisible(true)
      }
    }
  }, [sessionInfoQuery.data])

  return (
    <>
      <div
        className={`absolute w-full h-full text-slate-100 ${inter.className}`}
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

            //console.log(res.data)

            if (
              res.data &&
              (('duplicate' in res.data &&
                typeof res.data.duplicate === 'boolean') ||
                ('invalid' in res.data &&
                  typeof res.data.invalid === 'boolean'))
            ) {
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
            <input className='absolute h-10 opacity-0' type='text'></input>
          </div>
        )}
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
        {sessionInfoQuery.data && sessionInfoQuery.data.finished ? (
          <div
            className={`relative flex flex-col gap-y-2 text-center self-center justify-center items-center select-none ${inter.className}`}>
            {definitionQuery.data && definitionQuery.data[0] && (
              <div className='bg-gray-700 p-2 rounded-lg w-80'>
                <div>
                  {
                    definitionQuery.data[0].meanings[0].definitions[0]
                      .definition
                  }
                </div>
              </div>
            )}
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
                    className='bg-slate-700 p-2 rounded-lg'>
                    Claim it!
                  </button>
                </div>
              )}
            <div>
              <button
                onClick={async () => {
                  //console.log(fingerprint)
                  if (fingerprint && fingerprint !== '') {
                    const res = await createSessionQuery.refetch()
                    setGuessedWords([])
                    setHistory([])
                    setConfettiVisible(false)

                    router.push(`/game/${res.data}`)
                  }
                }}
                className={`bg-slate-700 p-2 rounded-lg`}>
                {createSessionQuery.isRefetching ? (
                  <svg
                    aria-hidden='true'
                    className='w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-slate-100'
                    viewBox='0 0 100 101'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'>
                    <path
                      d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
                      fill='currentColor'
                    />
                    <path
                      d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
                      fill='currentFill'
                    />
                  </svg>
                ) : (
                  'Start new game'
                )}
              </button>
            </div>
          </div>
        ) : (
          <></>
        )}
        <div>
          <div
            className={`w-5 h-5 transition-colors ${
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
