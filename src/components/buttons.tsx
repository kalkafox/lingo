import { fingerprintAtom, gameAtom, lingoHistoryAtom } from '@/util/atoms'
import {
  useClipboardSpring,
  useCreateSession,
  useSessionInfo,
} from '@/util/hooks'
import { trpc } from '@/util/trpc'
import { Icon } from '@iconify/react'
import { animated } from '@react-spring/web'
import { useAction } from 'convex/react'
import { useAtom } from 'jotai'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { api } from '../../convex/_generated/api'
import { LoadingSpinner } from './helpers'
import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

export const NewGame = () => {
  const router = useRouter()

  const [fingerprint, setFingerprint] = useAtom(fingerprintAtom)

  const [history, setHistory] = useAtom(lingoHistoryAtom)

  const createSession = useCreateSession()

  const session = useSession()

  const notifySession = useAction(api.functions.verifyAndMutateSession)

  return (
    <Button
      onClick={async () => {
        if (fingerprint && fingerprint !== '') {
          const res = await createSession.mutateAsync({
            fingerprint,
            settings: {
              firstLetter: true,
            },
          })
          setHistory([])

          notifySession({
            sessionId: res,
            token: session.data?.user.token!,
          })

          router.push(`/game/${res}`)
        }
      }}
      className={``}
    >
      {createSession.isPending ? <LoadingSpinner /> : 'New game'}
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
}: Readonly<{
  status: 'authenticated' | 'unauthenticated' | 'loading'
}>) {
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
