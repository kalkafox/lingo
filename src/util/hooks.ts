import { useSpring } from '@react-spring/web'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { gameAtom } from './atoms'
import { trpc } from './trpc'

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

export function useClipboardSpring() {
  const clipboardSpring = useSpring({ y: 0, opacity: 0, display: 'none' })
  const interpolateClipboardOpacity = clipboardSpring.opacity.to(
    [0, 0.25, 0.5, 0.75, 1],
    [0, 0.5, 1, 0.5, 0],
  )

  const animateClipboard = async () => {
    navigator.clipboard.writeText(window.location.href)
    if (clipboardSpring.y.isAnimating) {
      clipboardSpring.opacity.set(0)
      clipboardSpring.y.set(0)
    }
    clipboardSpring.display.set('inline')
    clipboardSpring.opacity.start(1)
    await clipboardSpring.y.start(-20)
    if (clipboardSpring.y.isAnimating) return
    clipboardSpring.y.set(0)
    clipboardSpring.opacity.set(0)
    clipboardSpring.display.set('none')
  }

  return { clipboardSpring, interpolateClipboardOpacity, animateClipboard }
}
