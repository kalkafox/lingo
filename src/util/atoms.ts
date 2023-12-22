import { LingoRow, LingoRows, Settings } from '@/types/lingo'
import { atom } from 'jotai'

// LingoRows instance
export const lingoHistoryAtom = atom<LingoRows>([])
export const lingoRowAtom = atom<LingoRow>([])

export const fingerprintAtom = atom<undefined | string>(undefined)

export const gameSettingsAtom = atom<Settings>({
  firstLetter: true,
})

export const confettiVisibleAtom = atom(false)

export const pathHistoryAtom = atom<string[]>([])
