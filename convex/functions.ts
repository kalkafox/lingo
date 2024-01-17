import type { ConvexLingoSession } from '@/types/lingo';
import { AnyDataModel, GenericActionCtx } from 'convex/server';
import { v } from 'convex/values';
import { action, internalMutation, internalQuery, query } from './_generated/server';
import { VerifyOutputWithSessionId, getVerifyData, mutateSession } from './verifyAndMutateSession';

export async function verifyAndMutateSessionHandler(
  ctx: GenericActionCtx<AnyDataModel>,
  args: any,
) {
  try {
    const input = {
      token: args.token,
      sessionId: args.sessionId,
    };

    const verifiedData = await getVerifyData(input);

    if (verifiedData?.session.id) {
      await mutateSession(ctx, verifiedData as VerifyOutputWithSessionId);
    }

    return input;
  } catch (e) {
    console.error('Unable to verify session', e);

    return undefined;
  }
}

export const verifyAndMutateSession = action({
  args: { sessionId: v.string(), token: v.optional(v.string()) },
  handler: verifyAndMutateSessionHandler,
});

export const updateSession = internalMutation({
  args: { id: v.id('sessions'), complete: v.boolean() },
  handler: async (ctx, args) => {
    const data = await ctx.db.get(args.id);

    await ctx.db.delete(args.id);

    await ctx.db.insert('sessions', {
      sessionId: data.sessionId,
      name: data.name,
      image: data.image,
      complete: args.complete,
    });
  },
});

export const checkSession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .filter((q) => {
        return q.eq(q.field('sessionId'), args.sessionId);
      })
      .first();
    return session;
  },
});

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
});

export const getLatestSession = query({
  args: {},
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query('sessions').order('desc').take(1);

    return sessions[0] as ConvexLingoSession;
  },
});
