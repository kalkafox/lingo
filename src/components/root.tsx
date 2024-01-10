import { SpringValue, animated, useSpring } from '@react-spring/web'
import { Toaster } from './ui/sonner'
import { Icon } from '@iconify/react'
import {
  Select,
  SelectContent,
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
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { generatePattern } from '@/util/svg-patterns'
import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  fingerprintAtom,
  gameAtom,
  guessedLingoAtom,
  settingsOpenAtom,
  skipNotifyCreateSessionAtom,
  windowSizeAtom,
} from '@/util/atoms'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useCreateSession } from '@/util/hooks'
import { SessionList } from './session-list'

function LingoRoot({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const zoomSpring = useSpring({
    from: {
      scale: 1,
    },
  })

  // TODO: filter api return

  const [sessionListOpen, setSessionListOpen] = useState(false)

  const [windowSize, setWindowSize] = useAtom(windowSizeAtom)

  const handleResize = (e: UIEvent) => {
    setSessionListOpen(false)
    setWindowSize({
      // @ts-ignore
      width: e.target?.innerWidth,
      // @ts-ignore
      height: e.target?.innerHeight,
    })
  }

  useEffect(() => {
    // Set initial window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Add event listener for window resize
    window.addEventListener('resize', handleResize)

    // Remove event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const fingerprint = useAtomValue(fingerprintAtom)

  const sessionListSpring = useSpring({
    opacity: 0,
    config: {
      tension: 500,
    },
  })

  useEffect(() => {
    if (sessionListOpen) {
      sessionListSpring.opacity.start(1)
    }
  }, [sessionListOpen])

  return (
    <>
      <div
        style={{
          backgroundImage: generatePattern('connections', theme, 0.08),
        }}
        className="fixed -z-10 h-full w-full transition-colors"
      />
      <Toaster theme={'dark'} />
      <animated.div style={zoomSpring}>{children}</animated.div>
      <div className="fixed right-0">
        <Profile setSessionListOpen={setSessionListOpen} />
      </div>

      <Loader />
      <Settings zoom={zoomSpring} />
      {sessionListOpen ? (
        <animated.div
          style={sessionListSpring}
          className="fixed left-0 right-0 m-auto flex h-full w-full justify-center bg-neutral-900/90 backdrop-blur-md dark:bg-neutral-900/10"
        >
          <SessionList
            listSpring={sessionListSpring}
            setSessionListOpen={setSessionListOpen}
            forceShow={sessionListOpen}
          />
        </animated.div>
      ) : null}
    </>
  )
}

function processGreeting(name: string | null | undefined) {
  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  const suffix = greeting.endsWith('?') ? '?' : '!'

  return `${greeting.replace(/[?!]$/, '')}${name ? `, ${name}` : ''}${suffix}`
}

function Profile({
  setSessionListOpen,
}: {
  setSessionListOpen?: Dispatch<SetStateAction<boolean>>
}) {
  const [open, setOpen] = useAtom(settingsOpenAtom)
  const [skipNotifyCreateSession, setSkipNotifyCreateSession] = useAtom(
    skipNotifyCreateSessionAtom,
  )
  const { setTheme, theme } = useTheme()
  const router = useRouter()
  const session = useSession()

  const setGuessedWords = useSetAtom(guessedLingoAtom)

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

  const [game, setGame] = useAtom(gameAtom)

  const [windowSize, setWindowSize] = useAtom(windowSizeAtom)

  const createSession = useCreateSession()

  const [greeting, setGreeting] = useState('ur gay')

  const [alertActive, setAlertActive] = useState(false)

  const [{ active }] = useAtom(gameAtom)

  const dropdownRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const sessionName = session.data?.user?.name

    setGreeting(processGreeting(sessionName))
  }, [session.status, dropdownRef.current])

  useEffect(() => {
    if (game.active || router.asPath !== '/game') return
    const doCreateSession = async () => {
      try {
        const res = await createSession.mutateAsync({
          fingerprint: fingerprint,
          settings: {
            firstLetter: true,
          },
        })

        setGame({ ...game, gameId: res, active: true })

        router.push(`/game/${res}`)
      } catch (e) {
        toast.error('Sorry, there was en error connecting to the db :(')
      }
    }

    doCreateSession()
  }, [game.active, router.asPath])

  return (
    <>
      <AlertDialog open={alertActive}>
        <AlertDialogOverlay className="bg-neutral-900/80 backdrop-blur-sm" />
        <AlertDialogContent className="cogs">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-start gap-x-2">
              <Icon className="inline" icon="icon-park-outline:word" />
              <div>You have a current session running!</div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be able to return back to it later. Are you sure you want
              to start a new game?
            </AlertDialogDescription>
            <div className="flex items-center justify-start gap-x-2">
              <Switch
                checked={skipNotifyCreateSession}
                onCheckedChange={(e) => setSkipNotifyCreateSession(e)}
              />
              <div>Don&apos;t show this to me again</div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAlertActive(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setAlertActive(false)
                setGame({
                  ...game,
                  active: false,
                })
                router.push('/game')
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) return
          setGreeting(processGreeting(session.data?.user?.name))
        }}
      >
        <DropdownMenuTrigger className="mx-8 my-2 outline-none ">
          {session.status !== 'authenticated' ? (
            <Image
              className={'inline rounded-full'}
              //src={session.data?.user?.image!}
              src="https://avatars.githubusercontent.com/u/9144208?v=4"
              width={64}
              height={64}
              alt={'owner_avatar'}
            />
          ) : (
            <Icon className="m-2 text-4xl" icon="mdi:user" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          style={{
            backgroundImage: generatePattern(
              'hexagon',
              theme,
              theme === 'light' ? 0.02 : 0.08,
            ),
          }}
          className="bg-neutral-300/80 backdrop-blur-sm dark:bg-neutral-900/80"
        >
          <DropdownMenuLabel>{greeting}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              if (active && !skipNotifyCreateSession) {
                setAlertActive(true)
                return
              }
              setGame({
                ...game,
                active: false,
              })
              setGuessedWords([])
              router.push('/game')
            }}
          >
            <Icon className="text-lg" icon="icon-park-outline:word" />
            <div className="mx-2">Start new game</div>
          </DropdownMenuItem>
          {windowSize.width <= 850 ? (
            <DropdownMenuItem
              onSelect={(e) => {
                if (setSessionListOpen) {
                  setSessionListOpen(true)
                }
              }}
            >
              <Icon className="text-lg" icon="gg:list" />
              <div className="mx-2">Sessions</div>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={(e) => setOpen(true)}>
            <Icon className="text-lg" icon="mdi:gear" />
            <div className="mx-2">Settings</div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) =>
              window.open('https://github.com/kalkafox/lingo', '_blank')
            }
          >
            <Icon className="text-lg" icon="mdi:github" />
            <div className="mx-2">View project on GitHub</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenu>
            <div className="flex justify-center">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function Settings({ zoom }: { zoom: { scale: SpringValue<number> } }) {
  const { theme } = useTheme()
  const [open, setOpen] = useAtom(settingsOpenAtom)

  const settingWindowSpring = useSpring({
    scale: open ? 1 : 0.95,
  })

  const [skipNotifyCreateSession, setSkipNotifyCreateSession] = useAtom(
    skipNotifyCreateSessionAtom,
  )

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

  useEffect(() => {
    console.log(open)
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
      className="fixed top-0 flex h-full w-full items-center justify-center bg-neutral-900/20 backdrop-blur-md transition-colors"
    >
      <animated.div
        style={{
          ...cogSpring,
          backgroundImage: generatePattern('cogs', theme, 0.08),
        }}
        className="fixed -z-10 h-[110%] w-[110%]"
      ></animated.div>
      <animated.div
        style={{
          ...settingWindowSpring,
          backgroundImage: generatePattern(
            'hexagon',
            theme,
            theme === 'light' ? 0.02 : 0.08,
          ),
        }}
        className="border-1 hexagon rounded-lg bg-neutral-100 p-6 dark:border-neutral-300 dark:bg-neutral-900"
      >
        <div className="relative bottom-5 left-5 flex items-end justify-end">
          <button onClick={() => setOpen(false)}>
            <Icon icon="carbon:close-outline" />
          </button>
        </div>
        {/* <div className='flex justify-center items-center gap-x-1'>
          <Icon icon='mdi:gear' className='inline' />
          <div>Settings</div>
        </div> file-icons:font-outline*/}
        <div className="flex flex-col gap-4">
          <Select>
            <SelectTrigger className="w-[180px]">
              <Icon className="text-2xl" icon="file-icons:font-outline" />
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent></SelectContent>
          </Select>
          <div className="flex items-center gap-x-1">
            <Switch
              checked={skipNotifyCreateSession}
              onCheckedChange={(e) => setSkipNotifyCreateSession(e)}
            />
            <div>
              Do not notify me before starting a game while one is active
            </div>
          </div>
        </div>
      </animated.div>
    </animated.div>
  )
}

export default LingoRoot
