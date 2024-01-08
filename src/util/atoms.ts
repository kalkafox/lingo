import type {
  GuessedLingoRow,
  LingoRow,
  LingoRows,
  LingoState,
  LocalSettings,
  Settings,
} from '@/types/lingo'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { createTRPCJotai } from 'jotai-trpc'
import { AppRouter } from '@/server/routers/_app'
import { getBaseUrl } from './trpc'
import { httpLink } from '@trpc/client'

const trpcJotai = createTRPCJotai<AppRouter>({
  links: [
    httpLink({
      url: getBaseUrl(),
    }),
  ],
})

// LingoRows instance
export const lingoHistoryAtom = atom<LingoRows>([])
export const wordInputAtom = atom<string>('')

export const fingerprintAtom = atomWithStorage<string | undefined>(
  'fingerprint',
  undefined,
)

export const gameSettingsAtom = atom<Settings>({
  firstLetter: true,
})

export const gameAtom = atom<LingoState>({
  gameId: null,
  active: false,
})

export const skipNotifyCreateSessionAtom = atomWithStorage(
  'skipNotifyCreateSession',
  false,
)

export const settingsOpenAtom = atom(false)

export const guessedLingoAtom = atom<GuessedLingoRow>([])

export const confettiVisibleAtom = atom(false)

export const pathHistoryAtom = atom<string[]>([])
