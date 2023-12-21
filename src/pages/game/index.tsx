import { trpc } from '@/util/trpc'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

function GameRoot() {
  const router = useRouter()

  const gameId = router.query.id
  const createSessionQuery = trpc.createSession.useQuery(null, {
    enabled: false,
  })

  useEffect(() => {
    const createSession = async () => {
      if (!gameId || gameId.length === 0) {
        const res = await createSessionQuery.refetch()

        router.push(`/game/${res.data}`)
      }
    }

    createSession()
  }, [])

  return <></>
}

export default GameRoot
