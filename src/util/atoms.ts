import { LingoRow, LingoRows } from '@/types/lingo'
import { atom } from 'jotai'

// LingoRows instance
export const lingoHistoryAtom = atom<LingoRows>([])
export const lingoRowAtom = atom<LingoRow>([])
