import Confetti from '@/components/confetti'
import { LingoGame } from '@/components/lingo-game'
import { useSessionInfo } from '@/util/hooks'

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
