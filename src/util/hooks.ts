import { trpc } from './trpc'
import { useAtomValue } from 'jotai'
import { gameAtom } from './atoms'
import { useEffect, useState } from 'react'

export function useCreateSession() {
  return trpc.createSession.useMutation()
}

export function useSessionInfo() {
  const { gameId } = useAtomValue(gameAtom)

  return trpc.getSessionInfo.useQuery(
    {
      id: gameId as string,
    },
    {
      enabled: false,
    },
  )
}

interface DocumentTouch {
  touches: TouchList
  targetTouches: TouchList
  changedTouches: TouchList
  createTouch(
    view: Window,
    target: EventTarget,
    identifier: number,
    pageX: number,
    pageY: number,
    screenX: number,
    screenY: number,
  ): Touch
}

function isTouchDevice() {
  if (typeof window === 'undefined') return false
  const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ')
  // @ts-ignore
  function mq(query) {
    return typeof window !== 'undefined' && window.matchMedia(query).matches
  }

  if (
    'ontouchstart' in window ||
    // @ts-ignore
    (window.DocumentTouch && document instanceof window.DocumentTouch)
  )
    return true

  const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('')
  return mq(query)
}

export default function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    const {
      isAndroid,
      isIPad13,
      isIPhone13,
      isWinPhone,
      isMobileSafari,
      isTablet,
    } = require('react-device-detect')
    setIsTouch(
      isTouch ||
        isAndroid ||
        isIPad13 ||
        isIPhone13 ||
        isWinPhone ||
        isMobileSafari ||
        isTablet ||
        isTouchDevice(),
    )
  }, [])

  return isTouch
}
