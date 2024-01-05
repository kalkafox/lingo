import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider, useAtom } from 'jotai'
import { trpc } from '@/util/trpc'
import {
  Dispatch,
  HTMLAttributes,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  fingerprintAtom,
  gameSettingsAtom,
  pathHistoryAtom,
} from '@/util/atoms'
import Head from 'next/head'
import meta from '@/data/meta.json'
import { useCreateSession } from '@/util/hooks'
import {
  SpringProps,
  SpringValue,
  animated,
  useSpring,
} from '@react-spring/web'
import { Icon } from '@iconify/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import greetings from '@/data/greetings'

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

  const [settingsOpen, setSettingsOpen] = useState(false)

  const { settingsSpring, zoomSpring } = useSettingsSpring()

  useEffect(() => {
    console.log(settingsOpen)
    zoomSpring.scale.start(settingsOpen ? 0.95 : 1)
    settingsSpring.opacity.start(settingsOpen ? 1 : 0)
    settingsSpring.scale.start(settingsOpen ? 1 : 0.95)
  }, [settingsOpen])

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
        <div className='fixed bottom-0'>
          <Profile setOpen={setSettingsOpen} />
        </div>
        <animated.div style={zoomSpring}>
          <Component {...pageProps} />
        </animated.div>
        <animated.div
          style={settingsSpring}
          className='fixed top-0 w-full h-full items-center flex justify-center transition-colors bg-neutral-900/20 backdrop-blur-sm'>
          <Settings setOpen={setSettingsOpen} />
        </animated.div>
      </Provider>
    </SessionProvider>
  )
}

function processGreeting(name: string | null | undefined) {
  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  const suffix = greeting.endsWith('?') ? '?' : '!'

  console.log(name)

  return `${greeting.replace(/[?!]$/, '')}${name ? `, ${name}` : ''}${suffix}`
}

function Profile({ setOpen }: { setOpen: Dispatch<SetStateAction<boolean>> }) {
  const session = useSession()

  const [greeting, setGreeting] = useState('ur gay')

  const dropdownRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const sessionName = session.data?.user?.name

    setGreeting(processGreeting(sessionName))
  }, [session.status, dropdownRef.current])

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) return
        setGreeting(processGreeting(session.data?.user?.name))
      }}>
      <DropdownMenuTrigger className='outline-none'>
        <Icon className='text-4xl m-2' icon='mdi:user' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{greeting}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => setOpen(true)}>
          <Icon className='text-lg' icon='mdi:gear' />
          <div className='mx-2'>Settings</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Settings({ setOpen }: { setOpen: Dispatch<SetStateAction<boolean>> }) {
  return (
    <div className='bg-neutral-800 border-2 border-neutral-300 text-neutral-300 p-2 rounded-lg'>
      <div className='flex justify-end items-end left-1 bottom-1 relative'>
        <button onClick={() => setOpen(false)}>
          <Icon icon='carbon:close-outline' />
        </button>
      </div>
      {/* <div className='flex justify-center items-center gap-x-1'>
          <Icon icon='mdi:gear' className='inline' />
          <div>Settings</div>
        </div> file-icons:font-outline*/}
      <div>
        <Select>
          <SelectTrigger className='w-[180px]'>
            <Icon className='text-2xl' icon='file-icons:font-outline' />
            <SelectValue placeholder='Theme' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='light'>Light</SelectItem>
            <SelectItem value='dark'>Dark</SelectItem>
            <SelectItem value='system'>System</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function useSettingsSpring() {
  const zoomSpring = useSpring({
    from: {
      scale: 1,
    },
  })

  const settingsSpring = useSpring({
    from: {
      display: 'none',
      opacity: 0,
      scale: 0.95,
    },
    onStart: (e, ctrl) => {
      if (e.value.opacity < 1) {
        ctrl.set({
          display: '',
        })
      }
    },
    onRest: (e, ctrl) => {
      if (e.value.opacity < 0.1) {
        ctrl.set({
          display: 'none',
        })
      }
    },
  })

  return { zoomSpring, settingsSpring }
}

export default trpc.withTRPC(App)
