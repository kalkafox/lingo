import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider, useAtom } from 'jotai'
import { trpc } from '@/util/trpc'
import { useEffect, useRef, useState } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  fingerprintAtom,
  gameAtom,
  pathHistoryAtom,
  settingsOpenAtom,
} from '@/util/atoms'
import Head from 'next/head'
import meta from '@/data/meta.json'
import { useCreateSession } from '@/util/hooks'
import { SpringValue, animated, useSpring } from '@react-spring/web'
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
import { Loader } from '@/components/helpers'
import Image from 'next/image'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { router } from '@/server/trpc'
import { Switch } from '@/components/ui/switch'
import { Toaster } from 'sonner'

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  const router = useRouter()

  const [pathHistory, setPathHistory] = useAtom(pathHistoryAtom)
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom)
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
          const res = await createSession.mutateAsync({
            fingerprint: fingerprint,
            settings: {
              firstLetter: true,
            },
          })

          setPathHistory((prev) => [...prev, router.asPath])

          setGame({ ...game, gameId: res, active: true })

          router.push(`/game/${res}`)
        }
      }

      doCreateSession()
    }
  }, [router.asPath, game])

  const zoomSpring = useSpring({
    from: {
      scale: 1,
    },
  })

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
          <link
            rel='apple-touch-icon'
            sizes='180x180'
            href='/apple-touch-icon.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='/favicon-32x32.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='16x16'
            href='/favicon-16x16.png'
          />
          <link rel='manifest' href='/manifest.webmanifest' />
          <link rel='manifest' href='/site.webmanifest' />
        </Head>
        <Toaster theme={'dark'} />
        <div className='fixed w-full h-full transition-colors connections' />
        <animated.div style={zoomSpring}>
          <Component {...pageProps} />
        </animated.div>
        <div className='fixed bottom-0'>
          <Profile />
        </div>
        <Loader />
        <Settings zoom={zoomSpring} />
      </Provider>
    </SessionProvider>
  )
}

function processGreeting(name: string | null | undefined) {
  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  const suffix = greeting.endsWith('?') ? '?' : '!'

  return `${greeting.replace(/[?!]$/, '')}${name ? `, ${name}` : ''}${suffix}`
}

function Profile() {
  const [open, setOpen] = useAtom(settingsOpenAtom)
  const router = useRouter()
  const session = useSession()

  const [greeting, setGreeting] = useState('ur gay')

  const [alertActive, setAlertActive] = useState(false)

  const [{ active }] = useAtom(gameAtom)

  const dropdownRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const sessionName = session.data?.user?.name

    setGreeting(processGreeting(sessionName))
  }, [session.status, dropdownRef.current])

  return (
    <>
      <AlertDialog open={alertActive}>
        <AlertDialogOverlay className='backdrop-blur-sm' />
        <AlertDialogContent className='cogs'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex justify-start items-center gap-x-2'>
              <Icon className='inline' icon='icon-park-outline:word' />
              <div>You have a current session running!</div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be able to return back to it later. Are you sure you want
              to start a new game?
            </AlertDialogDescription>
            <div className='flex justify-start items-center gap-x-2'>
              <Switch />
              <div>
                Don&apos;t show this to me again (WIP, not finished yet)
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAlertActive(false)
              }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) return
          setGreeting(processGreeting(session.data?.user?.name))
        }}>
        <DropdownMenuTrigger className='outline-none'>
          {session.status === 'authenticated' ? (
            <Image
              className={'inline mx-2 rounded-lg'}
              src={session.data?.user?.name!}
              width={64}
              height={64}
              alt={'owner_avatar'}
            />
          ) : (
            <Icon className='text-4xl m-2' icon='mdi:user' />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className='bg-neutral-900/20 hexagon'>
          <DropdownMenuLabel>{greeting}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              if (active) {
                setAlertActive(true)
                return
              }
              router.push('/game')
            }}>
            <Icon className='text-lg' icon='icon-park-outline:word' />
            <div className='mx-2'>Start new game</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => setOpen(true)}>
            <Icon className='text-lg' icon='mdi:gear' />
            <div className='mx-2'>Settings</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function Settings({ zoom }: { zoom: { scale: SpringValue<number> } }) {
  const [open, setOpen] = useAtom(settingsOpenAtom)
  const settingsSpring = useSpring({
    from: {
      display: 'none',
      opacity: 0,
      scale: 1,
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

  const cogSpring = useSpring({ x: 0, y: 0 })

  const settingWindowSpring = useSpring({
    scale: 0.95,
  })

  useEffect(() => {
    settingWindowSpring.scale.start(open ? 1 : 0.95)
    settingsSpring.opacity.start(open ? 1 : 0)
    zoom.scale.start(open ? 0.95 : 1)
  }, [open])

  return (
    <animated.div
      onMouseMove={(e) => {
        cogSpring.x.start(-e.clientX * 0.01)
        cogSpring.y.start(-e.clientY * 0.01)
      }}
      style={settingsSpring}
      className='fixed top-0 w-full h-full items-center flex justify-center transition-colors bg-neutral-900/20 backdrop-blur-md'>
      <animated.div
        style={cogSpring}
        className='fixed w-[110%] h-[110%] cogs -z-10'></animated.div>
      <animated.div
        style={settingWindowSpring}
        className='bg-neutral-800 border-1 hexagon border-neutral-300 text-neutral-300 p-2 rounded-lg'>
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
            <SelectContent className='hover:[hexagon]'>
              <SelectItem value='light'>Light</SelectItem>
              <SelectItem value='dark'>Dark</SelectItem>
              <SelectItem value='system'>System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </animated.div>
    </animated.div>
  )
}

export default trpc.withTRPC(App)
