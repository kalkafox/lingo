import { TRPCError, initTRPC } from '@trpc/core'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { getServerAuthSession } from './auth'

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.

const secret = process.env.NEXTAUTH_SECRET

export const createContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts
  const session = await getServerAuthSession({ req, res })

  return {
    session,
  }
}

const t = initTRPC.context<typeof createContext>().create()
// Base router and procedure helpers

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

export const router = t.router
export const procedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
