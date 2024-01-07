import Confetti from '@/components/confetti'
import { useSessionInfo } from '@/util/hooks'
import { LingoGame } from '@/components/lingo-game'

function Game() {
  const sessionInfo = useSessionInfo()

  return (
    <>
      <LingoGame />
      <Confetti finished={sessionInfo.data?.finished} />
    </>
  )
}

export default Game
