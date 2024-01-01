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
  localSettingsAtom,
  pathHistoryAtom,
} from '@/util/atoms'
import Head from 'next/head'
import meta from '@/data/meta.json'

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  const router = useRouter()
  const gameId = router.query.id

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)
  const [pathHistory, setPathHistory] = useAtom(pathHistoryAtom)
  const [gameSettings, setGameSettings] = useAtom(gameSettingsAtom)
  const [localSettings, setLocalSettings] = useAtom(localSettingsAtom)

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
    // stupid hack
    const getBackground = () => {
      if (window.localStorage.getItem('background')) {
        setLocalSettings({
          background: window.localStorage.getItem('background')!,
        })
      }
    }

    const interval = setInterval(() => {
      getBackground()
    }, 500)

    getBackground()

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    console.log(localSettings)
  }, [localSettings])

  useEffect(() => {
    if (router.asPath === '/game') {
      const createSession = async () => {
        if (fingerprint && fingerprint !== '') {
          if (!gameId || gameId.length === 0) {
            //console.log(pathHistory)
            if (pathHistory.find((l) => l === router.asPath)) {
              return
            }
            const res = await createSessionQuery.refetch()

            //console.log(router.asPath)

            setPathHistory((prev) => [...prev, router.asPath])

            router.push(`/game/${res.data}`)
          }
        }
      }

      createSession()
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
        <div className='fixed w-full h-full transition-colors bg-neutral-900'></div>
        <Component {...pageProps} />
      </Provider>
    </SessionProvider>
  )
}

export default trpc.withTRPC(App)
