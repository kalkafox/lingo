import { GuessedLingoRow, GuessedChar } from '@/types/lingo'
import { fingerprintAtom, windowSizeAtom, guessedLingoAtom } from '@/util/atoms'
import useIsTouchDevice from '@/util/hooks'
import { trpc } from '@/util/trpc'
import { SpringValue } from '@react-spring/web'
import { useAtomValue, useAtom } from 'jotai'
import { useRouter } from 'next/router'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Dispatch, SetStateAction } from 'react'
import { Icon } from '@iconify/react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

function calculateTime(num: number) {
  const seconds = Math.floor(num / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  }
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date)
  return formattedDate
}

export function SessionList({
  lingoSpring,
  forceShow = false,
  listSpring,
  setSessionListOpen,
}: {
  lingoSpring?: { x: SpringValue<number>; opacity: SpringValue<number> }
  forceShow?: boolean
  listSpring?: { opacity: SpringValue<number> }
  setSessionListOpen?: Dispatch<SetStateAction<boolean>>
}) {
  const fingerprint = useAtomValue(fingerprintAtom)
  const sessions = trpc.getSessions.useQuery(fingerprint as string)
  const isMobile = useIsTouchDevice()
  const [windowSize, setWindowSize] = useAtom(windowSizeAtom)
  const [guessedWords, setGuessedWords] = useAtom(guessedLingoAtom)
  const router = useRouter()

  return forceShow || windowSize.width > 850 ? (
    <ScrollArea className="h-[500px] rounded-md p-4">
      <div className="flex flex-col">
        {sessions.data &&
          sessions.data.map((c, i) => {
            if (!c.history) return

            const words = Array.from(
              { length: c.history[0].length },
              (_, i) => {
                return {
                  letter: null,
                  correct: false,
                }
              },
            ) as GuessedLingoRow

            c.history.forEach((row) => {
              row.forEach((l, index) => {
                if (words[index].correct) {
                  return
                }
                words[index] = l.correct
                  ? ({ letter: l.letter, correct: true } as GuessedChar)
                  : ({ letter: '.', correct: false } as GuessedChar)
              })
            })

            const selected =
              c.uniqueId === router.asPath.split('/').slice(-1)[0]

            return (
              <button
                disabled={selected}
                onClick={async (e) => {
                  setGuessedWords([])
                  if (lingoSpring) {
                    lingoSpring.x.start(95)
                    lingoSpring.opacity.start(0)
                  }
                  router.push(`/game/${c.uniqueId}`)
                  if (listSpring && setSessionListOpen) {
                    await listSpring.opacity.start(0)
                    setSessionListOpen(false)
                  }
                }}
                key={i}
                className={`${
                  selected
                    ? 'border-neutral-900 dark:border-neutral-100'
                    : 'z-10 opacity-80'
                } my-2 rounded-lg border-2 bg-neutral-300 p-2 transition-all dark:bg-neutral-800/80`}
              >
                <div
                  className={`relative flex select-none justify-center gap-x-2 self-center py-1`}
                >
                  {words.map((v, index) => {
                    return (
                      <div
                        key={index}
                        className={`flex h-5 w-5 items-center justify-center border-2 border-neutral-800 dark:border-neutral-500 ${
                          v.correct
                            ? 'bg-green-500/80'
                            : 'bg-neutral-300/80 dark:bg-neutral-900/20'
                        }`}
                      >
                        <div className="text-xs">{(v && v.letter) ?? '.'}</div>
                      </div>
                    )
                  })}
                </div>
                {c.finished ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex">
                        <div className="flex items-center gap-x-1 text-xs">
                          <Icon icon="mdi:clock" />
                          {calculateTime(Date.now() - c.finished)} ago
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="">
                        <p>
                          Created on <b>{formatTimestamp(c.created)}</b>
                        </p>
                        <p>
                          Finished on <b>{formatTimestamp(c.created)}</b>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </button>
            )
          })}
      </div>
    </ScrollArea>
  ) : null
}
