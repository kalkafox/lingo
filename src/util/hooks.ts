import { trpc } from './trpc'
import { useAtomValue } from 'jotai'
import { gameAtom } from './atoms'

export function useCreateSession() {
  return trpc.createSession.useMutation()
}

export function useSessionInfo() {
  const { gameId } = useAtomValue(gameAtom)

  return trpc.getSessionInfo.useQuery(
    {
      id: gameId as string,
    },
    {
      enabled: false,
    },
  )
}
