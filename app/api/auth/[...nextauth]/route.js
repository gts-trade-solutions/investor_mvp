import NextAuth from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth'

const handler = (NextAuth.default || NextAuth)({
  ...authConfig,
  adapter: PrismaAdapter(prisma)
})

export { handler as GET, handler as POST }