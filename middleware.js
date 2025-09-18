import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Skip authentication checks if DISABLE_AUTH is enabled
    if (process.env.DISABLE_AUTH === 'true') {
      return
    }

    // Original authentication logic (commented out for UI testing)
    // const { pathname } = req.nextUrl
    // const token = req.nextauth.token

    // // Check role-based access
    // if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
    //   return Response.redirect(new URL('/auth/signin', req.url))
    // }

    // if (pathname.startsWith('/founder') && !['FOUNDER', 'ADMIN'].includes(token?.role)) {
    //   return Response.redirect(new URL('/auth/signin', req.url))
    // }

    // if (pathname.startsWith('/investor') && !['INVESTOR', 'ADMIN'].includes(token?.role)) {
    //   return Response.redirect(new URL('/auth/signin', req.url))
    // }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow all routes when authentication is disabled
        if (process.env.DISABLE_AUTH === 'true') {
          return true
        }
        
        // Allow all routes for UI testing
        return true
      }
    }
  }
)

export const config = {
  matcher: [
    '/founder/:path*',
    '/investor/:path*', 
    '/admin/:path*',
    '/settings/:path*',
    '/api/auth/:path*'
  ]
}