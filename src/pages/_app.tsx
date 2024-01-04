import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider, useAtom } from 'jotai'
import { trpc } from '@/util/trpc'
import { useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  fingerprintAtom,
  gameSettingsAtom,
  pathHistoryAtom,
} from '@/util/atoms'
import Head from 'next/head'
import meta from '@/data/meta.json'
import { useCreateSession, useSessionInfo } from '@/util/hooks'
import Confetti from '@/components/Confetti'

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  const router = useRouter()
  const gameId = router.query.id as string

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)
  const [pathHistory, setPathHistory] = useAtom(pathHistoryAtom)
  const [gameSettings, setGameSettings] = useAtom(gameSettingsAtom)

  const createSession = useCreateSession({ fingerprint, gameSettings })

  useEffect(() => {
    if (router.asPath === '/game') {
      const doCreateSession = async () => {
        if (fingerprint && fingerprint !== '') {
          if (!gameId || gameId.length === 0) {
            //console.log(pathHistory)
            if (pathHistory.find((l) => l === router.asPath)) {
              return
            }
            const res = await createSession.refetch()

            if (!res.data || res.error) {
              return
            }

            setPathHistory((prev) => [...prev, router.asPath])

            router.push(`/game/${res.data}`)
          }
        }
      }

      doCreateSession()
    }
  }, [router.asPath, fingerprint])

  useEffect(() => {
    if (window.localStorage.getItem('fingerprint')) {
      setFingerprint(window.localStorage.getItem('fingerprint') as string)
      return
    }
    const fpPromise = import('@fingerprintjs/fingerprintjs')

    fpPromise.then((t) =>
      t
        .load()
        .then((inst) => inst.get())
        .then((result) => {
          setFingerprint(result.visitorId)
          window.localStorage.setItem('fingerprint', result.visitorId)
        }),
    )
  }, [])

  return (
    <SessionProvider session={session}>
      <Provider>
        <Head>
          <meta name='msapplication-TileColor' content='#171717' />
          <meta name='theme-color' content='#171717' />
          <meta name='description' content={meta.description} />
          <meta property='og:title' content={meta.title} />
          <meta property='og:description' content={meta.description} />
          <meta property='og:image' content={meta.image} />
          <meta property='og:url' content={meta.url} />
          <meta property='og:type' content='website' />
          <meta property='og:site_name' content='kalkafox' />
          <meta property='og:locale' content='en_US' />
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:site' content='@kalkafox' />
          <meta name='twitter:creator' content='@kalkafox' />
          <meta name='twitter:title' content={meta.title} />
          <meta name='twitter:description' content={meta.description} />
          <meta name='twitter:image' content={meta.image} />
        </Head>
        <div className='fixed w-full h-full transition-colors bg-neutral-900' />
        <Component {...pageProps} />
      </Provider>
    </SessionProvider>
  )
}

export default trpc.withTRPC(App)
