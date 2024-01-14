import LingoRoot from '@/components/root'
import { ThemeProvider } from '@/components/theme-provider'
import '@/styles/globals.css'
import { trpc } from '@/util/trpc'
import { Provider } from 'jotai'
import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'

import { ConvexProvider, ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || '')

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider session={session}>
        <ConvexProvider client={convex}>
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
        </ConvexProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}

export default trpc.withTRPC(App)
