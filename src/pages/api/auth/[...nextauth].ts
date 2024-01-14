import { sessions } from '@/db/schema'
import { db } from '@/server/db'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import NextAuth, { NextAuthOptions } from 'next-auth'
import { Adapter } from 'next-auth/adapters'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions = {
  adapter: DrizzleAdapter(db) as Adapter,
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const dbSession = await db.query.sessions.findFirst({
          where: eq(sessions.userId, user.id),
        })
        if (dbSession) session.user.token = dbSession.sessionToken
      }

      session.user.id = user.id

      return session
    },
  },
} satisfies NextAuthOptions

export default NextAuth(authOptions)
