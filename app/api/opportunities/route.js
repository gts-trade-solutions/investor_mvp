export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createOpportunitySchema } from '@/lib/validations'

export async function GET(request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startupId = searchParams.get('startupId')
    const investorId = searchParams.get('investorId')

    const where = {
      ...(startupId && { startupId }),
      ...(investorId && { investorId })
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        startup: {
          select: {
            name: true,
            stage: true,
            geo: true,
            sector: true
          }
        },
        investor: {
          select: {
            name: true,
            title: true
          }
        },
        fund: {
          select: {
            name: true
          }
        },
        activities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ opportunities })
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createOpportunitySchema.parse(body)

    const userOrg = await prisma.orgMember.findFirst({
      where: { userId: session.user.id },
      include: { org: true }
    })

    if (!userOrg) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        ...validatedData,
        orgId: userOrg.orgId,
      },
      include: {
        startup: {
          select: {
            name: true,
            stage: true,
            geo: true
          }
        },
        investor: {
          select: {
            name: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error('Error creating opportunity:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}