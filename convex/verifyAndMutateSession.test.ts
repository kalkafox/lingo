import ky from 'ky'
import {
  createSessionPayload,
  getVerifyData,
  mutateSession,
} from './verifyAndMutateSession'

jest.mock('ky') // now ky is effectively overridden

describe('fetching verify endpoint', () => {
  // demonstrative/reusable function to simulate response from api
  function mockResponse(data: any) {
    ;(ky.get as any).mockReturnValue({
      json: () => Promise.resolve(data),
    })
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should throw an error if PUBLIC_URL is not defined', async () => {
    const originalEnv = process.env.PUBLIC_URL

    try {
      // Set process.env.PUBLIC_URL to undefined to simulate it not being defined
      delete process.env.PUBLIC_URL

      await expect(getVerifyData({})).rejects.toThrow()
    } finally {
      // Restore the original value of process.env.PUBLIC_URL
      process.env.PUBLIC_URL = originalEnv
    }
  })

  it.each([
    undefined,
    null,
    [],
    {},
    { wrongProperty: null },
    { result: null },
    { result: {} },
    { result: { data: null } },
  ])('treats %p as a bad response', async (response) => {
    mockResponse(response)
    await expect(getVerifyData({})).rejects.toThrow()
  })

  it('returns expected data', async () => {
    mockResponse({ result: { data: 'return me!' } })
    await expect(getVerifyData({})).resolves.toBe('return me!')
  })
})

describe('create session payload', () => {
  // sent input (user), expected output (partial)
  it.each([
    [
      {
        image: null,
        name: null,
      },
      { image: undefined, name: undefined },
    ],
    [
      {
        image: 'foo',
        name: 'bar',
      },
      { image: 'foo', name: 'bar' },
    ],
    [
      {
        image: null,
        name: 'bar',
      },
      { image: undefined, name: 'bar' },
    ],
    [
      {
        image: 'foo',
        name: null,
      },
      { image: 'foo', name: undefined },
    ],
  ])('%p gives %p in payload', (input, expected) => {
    const param = {
      user: input,
      session: { id: 'foo', finished: true },
    }
    expect(createSessionPayload(param)).toHaveProperty('image', expected.image)
  })

  it('gives all the proper data', () => {
    expect(
      createSessionPayload({
        user: { image: 'user-image', name: 'user-name' },
        session: { id: 'session-id', finished: false },
      }),
    ).toEqual({
      sessionId: 'session-id',
      complete: false,
      image: 'user-image',
      name: 'user-name',
    })
  })
})

describe('session mutator', () => {
  // helper
  function buildCtx(response: any) {
    const mutationFunction = jest.fn()

    return {
      ctx: {
        runQuery: jest.fn(() => Promise.resolve(response)),
        runMutation: mutationFunction,
      },
      mutationFunction,
    }
  }

  const sampleVerifiedData = {
    session: { id: 'foo', finished: true },
    user: { image: null, name: null },
  }

  it('creates session if none exists', async () => {
    const { ctx, mutationFunction } = buildCtx(null)
    await mutateSession(ctx, sampleVerifiedData)
    expect(mutationFunction).toHaveBeenCalledTimes(1)
    expect(mutationFunction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sessionId: 'foo' }),
    )
  })

  it('does nothing for completed sessions', async () => {
    const { ctx, mutationFunction } = buildCtx({ complete: true })
    await mutateSession(ctx, sampleVerifiedData)
    expect(mutationFunction).not.toHaveBeenCalled()
  })

  it('updates session if one exists', async () => {
    const { ctx, mutationFunction } = buildCtx({ _id: 'i am here' })
    await mutateSession(ctx, sampleVerifiedData)
    expect(mutationFunction).toHaveBeenCalledTimes(1)
    expect(mutationFunction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'i am here' }),
    )
  })
})
