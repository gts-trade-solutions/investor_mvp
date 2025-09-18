import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'

export const authConfig = {
  providers: [
    (CredentialsProvider.default || CredentialsProvider)({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { prisma } = await import('@/lib/prisma')
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role
        }
      }
    }),
    (GoogleProvider.default || GoogleProvider)({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    (GitHubProvider.default || GitHubProvider)({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
      }
      
      // Handle OAuth providers
      if (account?.provider === 'google' || account?.provider === 'github') {
        const { prisma } = await import('@/lib/prisma')
        const existingUser = await prisma.user.findUnique({
          where: { email: token.email }
        })
        
        if (existingUser) {
          token.role = existingUser.role
        } else {
          // Create new user for OAuth
          const newUser = await prisma.user.create({
            data: {
              name: token.name,
              email: token.email,
              image: token.picture,
              role: 'FOUNDER' // Default role
            }
          })
          token.role = newUser.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  }
}

