export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { investorFilterSchema, createInvestorSchema } from '@/lib/validations'

export async function GET(request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = Object.fromEntries(searchParams.entries())
    
    const validatedFilters = investorFilterSchema.parse({
      ...filters,
      sectors: filters.sectors ? filters.sectors.split(',') : undefined,
      stages: filters.stages ? filters.stages.split(',') : undefined,
      geos: filters.geos ? filters.geos.split(',') : undefined,
      page: filters.page ? parseInt(filters.page) : 1,
      limit: filters.limit ? parseInt(filters.limit) : 20
    })

    const where = {
      ...(validatedFilters.sectors && {
        sectors: {
          array_contains: validatedFilters.sectors
        }
      }),
      ...(validatedFilters.stages && {
        stages: {
          array_contains: validatedFilters.stages
        }
      }),
      ...(validatedFilters.geos && {
        geos: {
          array_contains: validatedFilters.geos
        }
      }),
      ...(validatedFilters.search && {
        name: {
          contains: validatedFilters.search,
          mode: 'insensitive'
        }
      })
    }

    const investors = await prisma.investor.findMany({
      where,
      include: {
        org: {
          select: {
            name: true,
            slug: true
          }
        },
        fund: {
          select: {
            name: true,
            checkSizeMin: true,
            checkSizeMax: true
          }
        }
      },
      skip: (validatedFilters.page - 1) * validatedFilters.limit,
      take: validatedFilters.limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const total = await prisma.investor.count({ where })

    return NextResponse.json({
      investors,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total,
        pages: Math.ceil(total / validatedFilters.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching investors:', error)
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
    const validatedData = createInvestorSchema.parse(body)

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

    const investor = await prisma.investor.create({
      data: {
        ...validatedData,
        orgId: userOrg.orgId,
        userId: session.user.id,
        sectors: JSON.stringify(validatedData.sectors),
        stages: JSON.stringify(validatedData.stages),
        geos: JSON.stringify(validatedData.geos),
      },
      include: {
        org: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(investor, { status: 201 })
  } catch (error) {
    console.error('Error creating investor:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}