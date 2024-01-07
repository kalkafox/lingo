// Correct = highlighted red
// oop = letter is out of position
// zilch = nada, letter doesn't exist in word

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

// We're not checking for length here because there may be cases where the LingoRow returns with length < 5
// I may rewrite this in the future depending on how i want to handle the error case here
export type LingoRow = Char[]

export type GuessedLingoRow = GuessedChar[]

export type LingoRows = LingoRow[]
