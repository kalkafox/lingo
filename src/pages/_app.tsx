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
