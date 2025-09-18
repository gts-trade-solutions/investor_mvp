import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

// Mock session for UI testing when authentication is disabled
const mockSession = {
  user: {
    id: 'mock-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN', // Admin role allows access to all areas
    image: null
  }
}

const mockMembership = {
  id: 'mock-membership-id',
  orgId: 'mock-org-id',
  userId: 'mock-user-id',
  role: 'OWNER'
}

export async function getSession() {
  if (process.env.DISABLE_AUTH === 'true') {
    return mockSession
  }
  return await getServerSession(authConfig)
}

export async function requireAuth() {
  if (process.env.DISABLE_AUTH === 'true') {
    return mockSession
  }
  const session = await getSession()
  if (!session) {
    redirect('/auth/signin')
  }
  return session
}

export async function requireRole(roles) {
  if (process.env.DISABLE_AUTH === 'true') {
    return mockSession
  }
  const session = await requireAuth()
  const userRoles = Array.isArray(roles) ? roles : [roles]
  
  if (!userRoles.includes(session.user.role)) {
    redirect('/auth/signin?error=insufficient_permissions')
  }
  
  return session
}

export async function requireOrgAccess(orgId, minRole = 'VIEWER') {
  if (process.env.DISABLE_AUTH === 'true') {
    return { session: mockSession, membership: mockMembership }
  }
  const session = await requireAuth()
  
  // Admin can access all orgs
  if (session.user.role === 'ADMIN') {
    return session
  }
  
  const membership = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId: session.user.id
    }
  })
  
  if (!membership) {
    redirect('/auth/signin?error=no_org_access')
  }
  
  // Check role hierarchy
  const roleHierarchy = {
    VIEWER: 0,
    EDITOR: 1,
    ADMIN: 2,
    OWNER: 3
  }
  
  if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
    redirect('/auth/signin?error=insufficient_org_permissions')
  }
  
  return { session, membership }
}

export async function assertOrgAccess(orgId, userId, minRole = 'VIEWER') {
  if (process.env.DISABLE_AUTH === 'true') {
    return true
  }
  // Admin bypass
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (user?.role === 'ADMIN') {
    return true
  }
  
  const membership = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId
    }
  })
  
  if (!membership) {
    return false
  }
  
  const roleHierarchy = {
    VIEWER: 0,
    EDITOR: 1,
    ADMIN: 2,
    OWNER: 3
  }
  
  return roleHierarchy[membership.role] >= roleHierarchy[minRole]
}

export async function getUserOrgs(userId) {
  if (process.env.DISABLE_AUTH === 'true') {
    return [
      {
        id: 'mock-membership-id',
        orgId: 'mock-org-id',
        userId: 'mock-user-id',
        role: 'OWNER',
        org: {
          id: 'mock-org-id',
          name: 'Test Organization',
          slug: 'test-org'
        }
      }
    ]
  }
  return await prisma.orgMember.findMany({
    where: { userId },
    include: {
      org: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
}

export async function canAccessEntity(entityType, entityId, userId) {
  if (process.env.DISABLE_AUTH === 'true') {
    return true
  }
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  // Admin can access everything
  if (user?.role === 'ADMIN') {
    return true
  }
  
  // Check entity ownership/org access based on type
  switch (entityType) {
    case 'startup':
      const startup = await prisma.startup.findUnique({
        where: { id: entityId }
      })
      return startup ? await assertOrgAccess(startup.orgId, userId) : false
      
    case 'investor':
      const investor = await prisma.investor.findUnique({
        where: { id: entityId }
      })
      return investor ? await assertOrgAccess(investor.orgId, userId) : false
      
    case 'opportunity':
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: entityId }
      })
      return opportunity ? await assertOrgAccess(opportunity.orgId, userId) : false
      
    default:
      return false
  }
}