import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider } from 'jotai'
import { trpc } from '@/util/trpc'
import { useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  // const [fingerprint, setFingerprint] = useState('')

  // const loginQuery = trpc.login.useQuery(fingerprint, {
  //   enabled: false,
  // })

  // useEffect(() => {
  //   const loadFingerprintJS = async () => {
  //     const fp = await import('@fingerprintjs/fingerprintjs')

  //     const fpInstance = await fp.load()
  //     const fpRes = await fpInstance.get()

  //     setFingerprint(fpRes.visitorId)

  //     console.log('Loaded Fingerprint JS.')
  //   }

  //   loadFingerprintJS()
  // }, [])

  // useEffect(() => {
  //   if (fingerprint.length != 0) {
  //     loginQuery.refetch()
  //   }
  // }, [fingerprint])

  return (
    <SessionProvider session={session}>
      <Provider>
        <Component {...pageProps} />
      </Provider>
    </SessionProvider>
  )
}

export default trpc.withTRPC(App)
