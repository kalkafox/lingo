import { useCallback, useEffect, useRef } from 'react'

import ReactCanvasConfetti from 'react-canvas-confetti'

export default function Confetti({
  finished,
}: {
  finished: number | null | undefined
}) {
  const refAnimationInstance = useRef<HTMLCanvasElement>(null)

  // @ts-ignore
  const getInstance = useCallback((instance) => {
    // @ts-ignore
    refAnimationInstance.current = instance
  }, [])

  // @ts-ignore
  const makeShot = useCallback((particleRatio, opts) => {
    refAnimationInstance.current &&
      // @ts-ignore
      refAnimationInstance.current({
        ...opts,
        origin: { y: 0.7 },
        particleCount: Math.floor(200 * particleRatio),
      })
  }, [])

  const fire = useCallback(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55,
    })

    makeShot(0.2, {
      spread: 60,
    })

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    })

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    })

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }, [makeShot])

  useEffect(() => {
    if (!finished) return
    console.log(finished)
    const now = Date.now()

    console.log(now - finished)

    if (now - finished >= 5000) return

    fire()
  }, [finished])

  return (
    <ReactCanvasConfetti
      refConfetti={getInstance}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}
    />
  )
}
