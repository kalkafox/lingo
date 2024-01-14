import type {
  GuessedLingoRow,
  LingoRows,
  LingoState,
  Settings,
} from '@/types/lingo'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

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
