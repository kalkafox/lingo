import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth'

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext['req']
  res: GetServerSidePropsContext['res']
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions)
}
