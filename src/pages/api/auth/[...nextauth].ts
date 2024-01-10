import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/server/db'
import { Adapter } from 'next-auth/adapters'

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
}

export default NextAuth(authOptions)
