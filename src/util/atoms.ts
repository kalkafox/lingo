import { AppRouter } from '@/server/routers/_app'
import type {
  GuessedLingoRow,
  LingoRows,
  LingoState,
  Settings,
} from '@/types/lingo'
import { httpLink } from '@trpc/client'
import { atom } from 'jotai'
import { createTRPCJotai } from 'jotai-trpc'
import { atomWithStorage } from 'jotai/utils'
import { getBaseUrl } from './trpc'

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

export const windowSizeAtom = atom({
  width: 0,
  height: 0,
})

export const settingsOpenAtom = atom(false)

export const guessedLingoAtom = atom<GuessedLingoRow>([])

export const confettiVisibleAtom = atom(false)

export const pathHistoryAtom = atom<string[]>([])
