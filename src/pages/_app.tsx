import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider, useAtom } from 'jotai'
import { trpc } from '@/util/trpc'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/router'
import { fingerprintAtom, gameAtom, pathHistoryAtom } from '@/util/atoms'
import { useCreateSession } from '@/util/hooks'
import { ThemeProvider } from '@/components/theme-provider'
import LingoRoot from '@/components/root'
import { toast } from 'sonner'

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  const router = useRouter()

  const [pathHistory, setPathHistory] = useAtom(pathHistoryAtom)
  const [game, setGame] = useAtom(gameAtom)

  const createSession = useCreateSession()

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)

  useEffect(() => {
    if (fingerprint) return

    const getFingerprint = async () => {
      const fp = await import('@fingerprintjs/fingerprintjs')

      const inst = await fp.load()
      const result = await inst.get()

      setFingerprint(result.visitorId)
    }

    getFingerprint()
  }, [fingerprint])

  useEffect(() => {
    if (router.asPath === '/game') {
      const doCreateSession = async () => {
        if (!game.gameId || game.gameId.length === 0) {
          //console.log(pathHistory)
          if (pathHistory.find((l) => l === router.asPath)) {
            return
          }

          try {
            const res = await createSession.mutateAsync({
              fingerprint: fingerprint,
              settings: {
                firstLetter: true,
              },
            })

            setPathHistory((prev) => [...prev, router.asPath])

            setGame({ ...game, gameId: res, active: true })

            router.push(`/game/${res}`)
          } catch (e) {
            toast.error('Sorry, there was en error connecting to the db :(')
          }
        }
      }

      doCreateSession()
    }
  }, [router.asPath, game])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider session={session}>
        <Provider>
          {/* <Toaster theme={'dark'} />
          <div className="connections fixed h-full w-full transition-colors" />
          <animated.div style={zoomSpring}>
            <Component {...pageProps} />
          </animated.div>
          <div className="fixed bottom-0">
            <Profile />
          </div>
          <Loader />
          <Settings zoom={zoomSpring} /> */}
          <LingoRoot>
            <Component {...pageProps} />
          </LingoRoot>
        </Provider>
      </SessionProvider>
    </ThemeProvider>
  )
}

export default trpc.withTRPC(App)
