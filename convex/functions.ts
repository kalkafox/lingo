import type { AppRouter } from '@/server/routers/_app'
import type { ConvexLingoSession } from '@/types/lingo'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server'

type RouterInput = inferRouterInputs<AppRouter>
type RouterOutput = inferRouterOutputs<AppRouter>

type VerifyOutput = RouterOutput['verify']

export const verifyAndMutateSession = action({
  args: { sessionId: v.string(), token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // wait about a second for the db to populate

    const input = {
      token: args.token,
      sessionId: args.sessionId,
    }

    const res = await fetch(
      `https://lingo.kalkafox.dev/api/trpc/verify?input=${JSON.stringify(
        input,
      )}`,
    )

    const data = await res.json()

    let verified_data = null

    // would you like more javascript with your typescript?
    if (
      typeof data === 'object' &&
      data &&
      'result' in data &&
      typeof data.result === 'object' &&
      data.result &&
      'data' in data.result &&
      typeof data.result.data === 'object' &&
      data.result.data
    ) {
      verified_data = data.result.data as VerifyOutput
    }

    if (!verified_data) return

    if (verified_data?.session.id) {
      const session: {
        _id: Id<'sessions'>
        complete: boolean
      } = await ctx.runQuery(internal.functions.checkSession, {
        sessionId: verified_data.session.id,
      })

      if (!session) {
        await ctx.runMutation(internal.functions.createSession, {
          sessionId: verified_data.session.id,
          complete: verified_data.session.finished,
          image: verified_data.user.image
            ? verified_data.user.image
            : undefined,
          name: verified_data.user.name ? verified_data.user.name : undefined,
        })

        return
      }

      if (session.complete) return

      if (verified_data.session.finished) {
        await ctx.runMutation(internal.functions.updateSession, {
          id: session._id,
          complete: verified_data.session.finished,
        })
      }
    }

    return input
  },
})

export const updateSession = internalMutation({
  args: { id: v.id('sessions'), complete: v.boolean() },
  handler: async (ctx, args) => {
    const data = await ctx.db.get(args.id)

    await ctx.db.delete(args.id)

    await ctx.db.insert('sessions', {
      sessionId: data.sessionId,
      name: data.name,
      image: data.image,
      complete: args.complete,
    })
  },
})

export const checkSession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .filter((q) => {
        return q.eq(q.field('sessionId'), args.sessionId)
      })
      .first()
    return session
  },
})

export const createSession = internalMutation({
  args: {
    sessionId: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    complete: v.boolean(),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert('sessions', {
      sessionId: args.sessionId,
      name: args.name,
      image: args.image,
      complete: args.complete,
    }),
})

export const getLatestSession = query({
  args: {},
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query('sessions').order('desc').take(1)

    return sessions[0] as ConvexLingoSession
  },
})
