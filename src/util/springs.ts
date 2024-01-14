import { useSpring } from '@react-spring/web'

export function useLingoSpring() {
  const [lingoSpring, lingoSpringApi] = useSpring(() => ({
    from: {
      x: 0,
      opacity: 0,
    },
    config: {
      tension: 800,
      bounce: 0.1,
    },
  }))

  return { lingoSpring, lingoSpringApi }
}
