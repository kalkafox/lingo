// Highly experimental, notifies clients of game activity using Convex

import { useQuery } from 'convex/react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'

function LingoNotifier() {
  const lastLingoSession = useQuery(api.functions.getLatestSession)

  const session = useSession()

  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!lastLingoSession) return

    setCount((n) => ++n)

    if (count < 1) return

    const ownsSession =
      lastLingoSession.name && session.data
        ? lastLingoSession.name === session.data.user.name
        : false

    if (!lastLingoSession.complete) {
      toast.info(
        <>
          {lastLingoSession.image ? (
            <Image
              className="rounded-lg"
              src={lastLingoSession.image}
              alt={lastLingoSession.name ?? 'user'}
              width={32}
              height={32}
            />
          ) : null}
          <div>{`${
            lastLingoSession.name
              ? ownsSession
                ? 'You'
                : lastLingoSession.name
              : 'An anonymous user'
          } just started a new game! ${ownsSession ? 'Good luck!' : ''}`}</div>
        </>,
      )
    }

    if (lastLingoSession.complete) {
      toast.success(
        <>
          {lastLingoSession.image ? (
            <Image
              className="rounded-lg"
              src={lastLingoSession.image}
              alt={lastLingoSession.name ?? 'user'}
              width={32}
              height={32}
            />
          ) : null}
          <div>{`${
            lastLingoSession.name
              ? ownsSession
                ? 'You'
                : lastLingoSession.name
              : 'An anonymous user'
          } finished a game! ${ownsSession ? 'Congrats!' : ''}`}</div>
        </>,
      )
    }
  }, [lastLingoSession])

  return <></>
}

export default LingoNotifier
