import 'server-only';
import { redirect } from 'next/navigation';
import getSupabaseServerClient  from "@/lib/supabaseServer";

// --- Mock session for local UI testing (optional) ---
const mockSession = {
  user: {
    id: 'mock-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN',
    image: null,
  },
};

const mockMembership = {
  id: 'mock-membership-id',
  orgId: 'mock-org-id',
  userId: 'mock-user-id',
  role: 'OWNER',
};

// Read Supabase user from server cookies and normalize to a "session"-like object
export async function getSession() {
  if (process.env.DISABLE_AUTH === 'true') return mockSession;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) return null;

  const u = data.user;
  return {
    user: {
      id: u.id,
      name: u.user_metadata?.full_name || u.email,
      email: u.email,
      role: (u.user_metadata?.role || 'FOUNDER').toUpperCase(),
      image: u.user_metadata?.avatar_url || null,
    },
  };
}

export async function requireAuth() {
  if (process.env.DISABLE_AUTH === 'true') return mockSession;

  const session = await getSession();
  if (!session) redirect('/auth/signin');
  return session;
}

export async function requireRole(roles) {
  if (process.env.DISABLE_AUTH === 'true') return mockSession;

  const session = await requireAuth();
  const needed = Array.isArray(roles) ? roles.map(r => r.toUpperCase()) : [String(roles).toUpperCase()];
  const current = (session.user.role || '').toUpperCase();

  if (!needed.includes(current)) {
    redirect('/auth/signin?error=insufficient_permissions');
  }
  return session;
}

// ---- The org helpers below still use `prisma` ----
// If your project exposes a prisma client, make sure it's accessible here.
// Example (adjust if needed): import prisma from '@/lib/prisma';

export async function requireOrgAccess(orgId, minRole = 'VIEWER') {
  if (process.env.DISABLE_AUTH === 'true') {
    return { session: mockSession, membership: mockMembership };
  }

  const session = await requireAuth();

  // Global admin can access all orgs
  if (session.user.role === 'ADMIN') return { session, membership: { role: 'OWNER' } };

  const membership = await prisma.orgMember.findFirst({
    where: { orgId, userId: session.user.id },
  });

  if (!membership) redirect('/auth/signin?error=no_org_access');

  const rank = { VIEWER: 0, EDITOR: 1, ADMIN: 2, OWNER: 3 };
  if (rank[membership.role] < rank[minRole]) {
    redirect('/auth/signin?error=insufficient_org_permissions');
  }

  return { session, membership };
}

export async function assertOrgAccess(orgId, userId, minRole = 'VIEWER') {
  if (process.env.DISABLE_AUTH === 'true') return true;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === 'ADMIN') return true;

  const membership = await prisma.orgMember.findFirst({ where: { orgId, userId } });
  if (!membership) return false;

  const rank = { VIEWER: 0, EDITOR: 1, ADMIN: 2, OWNER: 3 };
  return rank[membership.role] >= rank[minRole];
}

export async function getUserOrgs(userId) {
  if (process.env.DISABLE_AUTH === 'true') {
    return [
      {
        id: 'mock-membership-id',
        orgId: 'mock-org-id',
        userId: 'mock-user-id',
        role: 'OWNER',
        org: { id: 'mock-org-id', name: 'Test Organization', slug: 'test-org' },
      },
    ];
  }

  return prisma.orgMember.findMany({
    where: { userId },
    include: { org: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function canAccessEntity(entityType, entityId, userId) {
  if (process.env.DISABLE_AUTH === 'true') return true;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === 'ADMIN') return true;

  switch (entityType) {
    case 'startup': {
      const startup = await prisma.startup.findUnique({ where: { id: entityId } });
      return startup ? await assertOrgAccess(startup.orgId, userId) : false;
    }
    case 'investor': {
      const investor = await prisma.investor.findUnique({ where: { id: entityId } });
      return investor ? await assertOrgAccess(investor.orgId, userId) : false;
    }
    case 'opportunity': {
      const opportunity = await prisma.opportunity.findUnique({ where: { id: entityId } });
      return opportunity ? await assertOrgAccess(opportunity.orgId, userId) : false;
    }
    default:
      return false;
  }
}

// Convenience helpers (optional)
export function roleOf(session) {
  return (session?.user?.role || 'FOUNDER').toUpperCase();
}
export function isFounder(session) { return roleOf(session) === 'FOUNDER'; }
export function isInvestor(session) { return roleOf(session) === 'INVESTOR'; }
