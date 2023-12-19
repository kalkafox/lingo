import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider } from 'jotai'
import { trpc } from '@/util/trpc'

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider>
      <Component {...pageProps} />
    </Provider>
  )
}

export default trpc.withTRPC(App)
