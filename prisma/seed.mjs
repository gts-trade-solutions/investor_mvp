import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const sectors = [
  'FINTECH', 'HEALTHTECH', 'EDTECH', 'PROPTECH', 'RETAIL', 
  'ENTERPRISE', 'CONSUMER', 'DEEPTECH', 'CLEANTECH', 'MOBILITY'
]

const geos = ['US', 'UK', 'EU', 'ASIA', 'LATAM', 'AFRICA', 'GLOBAL']

const stages = ['PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'LATER_STAGE']

async function main() {
  console.log('🌱 Starting seed...')

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@investmatch.com',
      passwordHash: hashedPassword,
      role: 'ADMIN'
    }
  })

  const founderUser = await prisma.user.create({
    data: {
      name: 'Jane Founder',
      email: 'founder@startup.com',
      passwordHash: hashedPassword,
      role: 'FOUNDER'
    }
  })

  const investorUser = await prisma.user.create({
    data: {
      name: 'John Investor',
      email: 'investor@vc.com',
      passwordHash: hashedPassword,
      role: 'INVESTOR'
    }
  })

  // Create orgs
  const founderOrg = await prisma.org.create({
    data: {
      name: 'TechStart Inc',
      slug: 'techstart-inc'
    }
  })

  const investorOrg = await prisma.org.create({
    data: {
      name: 'VentureCapital Partners',
      slug: 'vc-partners'
    }
  })

  const adminOrg = await prisma.org.create({
    data: {
      name: 'InvestMatch Platform',
      slug: 'investmatch-platform'
    }
  })

  // Create org memberships
  await prisma.orgMember.createMany({
    data: [
      {
        orgId: founderOrg.id,
        userId: founderUser.id,
        role: 'OWNER'
      },
      {
        orgId: investorOrg.id,
        userId: investorUser.id,
        role: 'OWNER'
      },
      {
        orgId: adminOrg.id,
        userId: adminUser.id,
        role: 'OWNER'
      }
    ]
  })

  // Create sample startups
  const startup1 = await prisma.startup.create({
    data: {
      orgId: founderOrg.id,
      name: 'AI Analytics Platform',
      sector: JSON.stringify(['FINTECH', 'ENTERPRISE']),
      stage: 'SEED',
      geo: 'US',
      website: 'https://aianalytics.com',
      mrr: 50000, // $500 in cents
      teamSize: 12,
      isVisible: true
    }
  })

  const startup2 = await prisma.startup.create({
    data: {
      orgId: founderOrg.id,
      name: 'HealthTech Solutions',
      sector: JSON.stringify(['HEALTHTECH']),
      stage: 'SERIES_A',
      geo: 'EU',
      website: 'https://healthtech.com',
      mrr: 150000, // $1500 in cents
      teamSize: 25,
      isVisible: true
    }
  })

  // Create sample fund
  const fund1 = await prisma.fund.create({
    data: {
      orgId: investorOrg.id,
      name: 'Early Stage Ventures',
      checkSizeMin: 10000000, // $100k in cents
      checkSizeMax: 500000000, // $5M in cents
      sector: JSON.stringify(['FINTECH', 'HEALTHTECH', 'ENTERPRISE']),
      stage: JSON.stringify(['SEED', 'SERIES_A']),
      geo: JSON.stringify(['US', 'EU']),
      website: 'https://esventures.com'
    }
  })

  // Create investors
  const investor1 = await prisma.investor.create({
    data: {
      orgId: investorOrg.id,
      userId: investorUser.id,
      fundId: fund1.id,
      name: 'John Investor',
      title: 'Partner',
      sectors: JSON.stringify(['FINTECH', 'ENTERPRISE']),
      stages: JSON.stringify(['SEED', 'SERIES_A']),
      geos: JSON.stringify(['US', 'EU']),
      notes: 'Focuses on B2B SaaS and fintech'
    }
  })

  // Create opportunities
  const opportunity1 = await prisma.opportunity.create({
    data: {
      orgId: founderOrg.id,
      startupId: startup1.id,
      investorId: investor1.id,
      fundId: fund1.id,
      stage: 'CONTACTED',
      rating: 4,
      notes: 'Strong team, interesting product-market fit'
    }
  })

  // Create activities
  await prisma.activity.create({
    data: {
      orgId: founderOrg.id,
      opportunityId: opportunity1.id,
      userId: founderUser.id,
      type: 'email',
      note: 'Sent initial pitch deck'
    }
  })

  // Create sample program
  const program1 = await prisma.program.create({
    data: {
      orgId: adminOrg.id,
      title: 'Early Stage Accelerator',
      description: 'A 12-week program for early-stage startups',
      tags: JSON.stringify(['accelerator', 'mentorship', 'funding']),
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  })

  // Create application
  const application1 = await prisma.application.create({
    data: {
      programId: program1.id,
      orgId: founderOrg.id,
      startupId: startup1.id,
      status: 'IN_REVIEW',
      score: 85
    }
  })

  // Create perks
  await prisma.perk.createMany({
    data: [
      {
        orgId: adminOrg.id,
        title: 'AWS Credits',
        description: 'Get $10,000 in AWS credits for your startup',
        link: 'https://aws.amazon.com/startups'
      },
      {
        orgId: adminOrg.id,
        title: 'Legal Services',
        description: 'Free legal consultation for incorporation',
        link: 'https://legalservices.com'
      }
    ]
  })

  // Create saved lists
  const savedList1 = await prisma.savedList.create({
    data: {
      orgId: investorOrg.id,
      ownerId: investorUser.id,
      name: 'Promising Fintech Startups',
      type: 'STARTUPS'
    }
  })

  await prisma.savedListItem.create({
    data: {
      savedListId: savedList1.id,
      entityId: startup1.id
    }
  })

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: founderUser.id,
        type: 'investment_interest',
        title: 'New investor interest',
        body: 'John Investor has expressed interest in your startup'
      },
      {
        userId: investorUser.id,
        type: 'new_submission',
        title: 'New pitch deck received',
        body: 'AI Analytics Platform has submitted their pitch deck'
      }
    ]
  })

  console.log('✅ Seed completed successfully!')
  console.log(`
📊 Created:
- ${await prisma.user.count()} users
- ${await prisma.org.count()} organizations
- ${await prisma.startup.count()} startups
- ${await prisma.fund.count()} funds
- ${await prisma.investor.count()} investors
- ${await prisma.opportunity.count()} opportunities
- ${await prisma.program.count()} programs
- ${await prisma.application.count()} applications

🔑 Test Accounts:
- Admin: admin@investmatch.com / password123
- Founder: founder@startup.com / password123  
- Investor: investor@vc.com / password123
`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })