import { verifyAndMutateSessionHandler } from './functions'
import { getVerifyData, mutateSession } from './verifyAndMutateSession'

jest.mock('./verifyAndMutateSession')
// now we can separate the implementation from the test
// this lets us easily say "getVerifyData" should return "foo", etc

describe('verifyAndMutateSession handler', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fails if data cannot be verified', async () => {
    ;(getVerifyData as any).mockRejectedValue(new Error('foo'))

    await expect(
      verifyAndMutateSessionHandler(null as any, {}),
    ).resolves.toBeUndefined()
  })

  it('mutates the session if a session ID exists', async () => {
    ;(getVerifyData as any).mockResolvedValue({ session: { id: 'foo' } })

    await expect(
      verifyAndMutateSessionHandler(null as any, {}),
    ).resolves.not.toBeUndefined()

    expect(mutateSession).toHaveBeenCalled()
  })

  it('does NOT mutate the session if a session ID is not present', async () => {
    ;(getVerifyData as any).mockResolvedValue({ session: {} })

    await expect(
      verifyAndMutateSessionHandler(null as any, {}),
    ).resolves.not.toBeUndefined()

    expect(mutateSession).not.toHaveBeenCalled()
  })
})
