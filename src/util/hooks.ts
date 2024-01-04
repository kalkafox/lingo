import { Settings } from '@/types/lingo'
import { trpc } from './trpc'

export function useCreateSession({
  fingerprint,
  gameSettings,
}: {
  fingerprint: string | undefined
  gameSettings: Settings
}) {
  return trpc.createSession.useQuery(
    {
      fingerprint,
      settings: gameSettings,
    },
    {
      enabled: false,
    },
  )
}

export function useSessionInfo({ gameId }: { gameId: string }) {
  return trpc.getSessionInfo.useQuery(
    {
      id: gameId,
    },
    {
      enabled: false,
    },
  )
}
