import { fingerprintAtom, gameAtom, lingoHistoryAtom } from '@/util/atoms'
import {
  useClipboardSpring,
  useCreateSession,
  useSessionInfo,
} from '@/util/hooks'
import { trpc } from '@/util/trpc'
import { Icon } from '@iconify/react'
import { SpringValue, animated } from '@react-spring/web'
import { useAtom } from 'jotai'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './helpers'
import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

export const NewGame = (lingoSpring: {
  x: SpringValue<number>
  opacity: SpringValue<number>
}) => {
  const router = useRouter()

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)

  const [history, setHistory] = useAtom(lingoHistoryAtom)

  const createSession = useCreateSession()

  return (
    <Button
      onClick={async () => {
        //console.log(fingerprint)
        if (fingerprint && fingerprint !== '') {
          console.log('lol')
          lingoSpring.x.start(-90)
          lingoSpring.opacity.start(0)
          const res = await createSession.mutateAsync({
            fingerprint,
            settings: {
              firstLetter: true,
            },
          })
          lingoSpring.opacity.set(0)
          lingoSpring.x.set(95)
          setHistory([])
          //setConfettiVisible(false)

          router.push(`/game/${res}`)
        }
      }}
      className={``}
    >
      {createSession.isLoading ? <LoadingSpinner /> : 'New game'}
    </Button>
  )
}

export const CopyButton = ({ className }: { className?: string }) => {
  const { clipboardSpring, interpolateClipboardOpacity, animateClipboard } =
    useClipboardSpring()

  return (
    <div className={className}>
      <animated.div
        style={{
          ...clipboardSpring,
          opacity: interpolateClipboardOpacity,
        }}
        className="absolute inline"
      >
        <Icon
          className="-my-[0.5pt] mx-1 inline text-green-500"
          icon="mdi:check-bold"
          inline={true}
        />
      </animated.div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <button onClick={animateClipboard}>
              <Icon
                className="-my-[0.5pt] mx-1 inline rounded-sm transition-colors hover:bg-neutral-100/20"
                icon="ion:share-outline"
                inline={true}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share link (copies to clipboard)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export function ClaimButton({
  status,
}: {
  status: 'authenticated' | 'unauthenticated' | 'loading'
}) {
  const [{ gameId }] = useAtom(gameAtom)
  const claimSessionMutation = trpc.claimSession.useMutation()
  const sessionInfo = useSessionInfo()

  if (!gameId) return

  if (sessionInfo.data?.owner) return

  return (
    <Button
      onClick={async () => {
        switch (status) {
          case 'authenticated':
            await claimSessionMutation.mutateAsync(gameId)
            sessionInfo.refetch()
            break
          case 'unauthenticated':
            signIn()
            break
        }
      }}
    >
      Claim it!
    </Button>
  )
}
