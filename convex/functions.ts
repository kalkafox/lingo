import type { AppRouter } from '@/server/routers/_app';
import type { ConvexLingoSession } from '@/types/lingo';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { v } from 'convex/values';
import ky from 'ky';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

type VerifyOutput = RouterOutput['verify'];
type VerifyOutputWithSessionId = RouterOutput['verify'] & {
  session: { id: string };
};

async function getVerifyData(
  input: RouterInput['verify'],
): Promise<VerifyOutput> {
  const data = await ky
    .get(
      `https://lingo.kalkafox.dev/api/trpc/verify?input=${JSON.stringify(
        input,
      )}`,
    )
    .json<any>();

  const verifiedData = data?.result?.data as VerifyOutput | undefined;

  if (!verifiedData) throw new Error('Could not verify data');

  return verifiedData;
}

// session id must exist for this
function getCreateSessionPayload(verifiedData: VerifyOutputWithSessionId) {
  return {
    sessionId: verifiedData.session.id,
    complete: verifiedData.session.finished,
    image: verifiedData.user.image ?? undefined,
    name: verifiedData.user.name ?? undefined,
  };
}

type SessionType =
  | undefined
  | {
      _id: Id<'sessions'>;
      complete: boolean;
    };

async function mutateSession(
  ctx: any,
  verifiedData: VerifyOutputWithSessionId,
) {
  const session: SessionType = await ctx.runQuery(
    internal.functions.checkSession,
    {
      sessionId: verifiedData.session.id,
    },
  );

  if (!session) {
    await ctx.runMutation(
      internal.functions.createSession,
      getCreateSessionPayload(verifiedData),
    );
    return;
  }

  if (session.complete) return;

  if (verifiedData.session.finished) {
    await ctx.runMutation(internal.functions.updateSession, {
      id: session._id,
      complete: verifiedData.session.finished,
    });
  }
}

export const verifyAndMutateSession = action({
  args: { sessionId: v.string(), token: v.optional(v.string()) },
  handler: async (ctx, args) => {
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
  },
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
