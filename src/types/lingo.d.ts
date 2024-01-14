// Correct = highlighted red
// oop = letter is out of position
// zilch = nada, letter doesn't exist in word

import type { lingoSessions } from '@/db/schema'
import { InferSelectModel } from 'drizzle-orm'

export type Letter = (string & { length: 1 } & Uppercase<string>) | null

export interface Settings {
  firstLetter: boolean
}

export interface LocalSettings {
  background: string
}

export interface LingoState {
  gameId: string | undefined | null
  active: boolean
}

export interface Char {
  letter: Letter
  correct: boolean
  oop: boolean
  zilch: boolean
  invalid?: boolean
}

export interface GuessedChar {
  letter: Letter
  correct: boolean
}

export type LingoRow = Char[]

export type GuessedLingoRow = GuessedChar[]

export type LingoRows = LingoRow[]

export type LingoSession = InferSelectModel<typeof lingoSessions>

export type LingoSessions = LingoSession[]

export type ConvexLingoSession = {
  sessionId: string
  name?: string
  image?: string
  complete: boolean
}

export type ConvexLingoSessions = ConvexLingoSession[]
