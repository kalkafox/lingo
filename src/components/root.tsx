import { SpringValue, animated, useSpring } from '@react-spring/web'
import { Toaster } from './ui/sonner'
import { NextComponentType, NextPageContext } from 'next'
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
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { generatePattern } from '@/util/svg-patterns'
import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'
import { Provider, useAtom, useAtomValue } from 'jotai'
import { ReactNode, useEffect, useRef, useState } from 'react'
import {
  fingerprintAtom,
  gameAtom,
  settingsOpenAtom,
  skipNotifyCreateSessionAtom,
} from '@/util/atoms'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { trpc } from '@/util/trpc'

function LingoRoot({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const zoomSpring = useSpring({
    from: {
      scale: 1,
    },
  })

  // TODO: filter api return

  return (
    <>
      <div
        style={{
          backgroundImage: generatePattern(
            'connections',
            theme,
            theme === 'light' ? 0.2 : 0.08,
          ),
        }}
        className="fixed -z-10 h-full w-full transition-colors"
      />
      <Toaster theme={'dark'} />
      <animated.div style={zoomSpring}>{children}</animated.div>
      <div className="fixed bottom-0">
        <Profile />
      </div>
      <Loader />
      <Settings zoom={zoomSpring} />
    </>
  )
}

function processGreeting(name: string | null | undefined) {
  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  const suffix = greeting.endsWith('?') ? '?' : '!'

  return `${greeting.replace(/[?!]$/, '')}${name ? `, ${name}` : ''}${suffix}`
}

function Profile() {
  const [open, setOpen] = useAtom(settingsOpenAtom)
  const [skipNotifyCreateSession, setSkipNotifyCreateSession] = useAtom(
    skipNotifyCreateSessionAtom,
  )
  const { setTheme, theme } = useTheme()
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
        <DropdownMenuTrigger className="outline-none">
          {session.status === 'authenticated' ? (
            <Image
              className={'mx-2 inline rounded-lg'}
              src={session.data?.user?.image!}
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
              router.push('/game')
            }}
          >
            <Icon className="text-lg" icon="icon-park-outline:word" />
            <div className="mx-2">Start new game</div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => setOpen(true)}>
            <Icon className="text-lg" icon="mdi:gear" />
            <div className="mx-2">Settings</div>
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
