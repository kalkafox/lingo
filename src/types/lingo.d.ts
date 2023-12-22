// Correct = highlighted red
// oop = letter is out of position
// zilch = nada, letter doesn't exist in word

export type Letter = string & { length: 1 } & Uppercase<string>

export interface Settings {
  firstLetter: boolean
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
export type LingoRow = (Char[] & { length: 5 }) | []

export type GuessedLingoRow =
  | (GuessedChar[] & {
      length: 5
    })
  | []

export type LingoRows = LingoRow[]
