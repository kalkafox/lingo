// Highly experimental, notifies clients of game activity using Convex

import { useQuery } from 'convex/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'

function LingoNotifier() {
  const lastLingoSession = useQuery(api.functions.getLatestSession)

  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!lastLingoSession) return

    setCount((n) => ++n)

    if (count < 1) return

    console.log(lastLingoSession)

    if (!lastLingoSession.complete) {
      toast.info(
        <>
          {lastLingoSession.image ? (
            <Image
              className="rounded-lg"
              src={lastLingoSession.image}
              alt={lastLingoSession.name || 'user'}
              width={32}
              height={32}
            />
          ) : null}
          <div>{`${
            lastLingoSession.name ? lastLingoSession.name : 'An anonymous user'
          } just started a new game!`}</div>
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
              alt={lastLingoSession.name || 'user'}
              width={32}
              height={32}
            />
          ) : null}
          <div>{`${
            lastLingoSession.name ? lastLingoSession.name : 'An anonymous user'
          } just finished a game!`}</div>
        </>,
      )
    }
  }, [lastLingoSession])

  return <></>
}

export default LingoNotifier
