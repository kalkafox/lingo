import type { AppRouter } from '@/server/routers/_app'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import ky from 'ky'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

type RouterInput = inferRouterInputs<AppRouter>
type RouterOutput = inferRouterOutputs<AppRouter>

export type VerifyOutput = RouterOutput['verify']
export type VerifyOutputWithSessionId = RouterOutput['verify'] & {
  session: { id: string }
}

export async function getVerifyData(
  input: RouterInput['verify'],
): Promise<VerifyOutput> {
  if (!process.env.PUBLIC_URL)
    throw new Error(
      'PUBLIC_URL not defined, either set it in .env.local or convex environment variables!',
    )
  const data = await ky
    .get(
      `${process.env.PUBLIC_URL}/api/trpc/verify?input=${JSON.stringify(
        input,
      )}`,
    )
    .json<any>()

  const verifiedData = data?.result?.data as VerifyOutput | undefined

  if (!verifiedData) throw new Error('Could not verify data')

  return verifiedData
}

// session id must exist for this
export function createSessionPayload(verifiedData: VerifyOutputWithSessionId) {
  return {
    sessionId: verifiedData.session.id,
    complete: verifiedData.session.finished,
    image: verifiedData.user.image ?? undefined,
    name: verifiedData.user.name ?? undefined,
  }
}

type SessionType =
  | undefined
  | {
      _id: Id<'sessions'>
      complete: boolean
    }

export async function mutateSession(
  ctx: any,
  verifiedData: VerifyOutputWithSessionId,
) {
  const session: SessionType = await ctx.runQuery(
    internal.functions.checkSession,
    {
      sessionId: verifiedData.session.id,
    },
  )

  if (!session) {
    await ctx.runMutation(
      internal.functions.createSession,
      createSessionPayload(verifiedData),
    )
    return
  }

  if (session.complete) return

  if (verifiedData.session.finished) {
    await ctx.runMutation(internal.functions.updateSession, {
      id: session._id,
      complete: verifiedData.session.finished,
    })
  }
}
