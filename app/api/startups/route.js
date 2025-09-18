export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startupFilterSchema, createStartupSchema } from '@/lib/validations'

export async function GET(request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = Object.fromEntries(searchParams.entries())
    
    // Parse and validate filters
    const validatedFilters = startupFilterSchema.parse({
      ...filters,
      sectors: filters.sectors ? filters.sectors.split(',') : undefined,
      stages: filters.stages ? filters.stages.split(',') : undefined,
      geos: filters.geos ? filters.geos.split(',') : undefined,
      page: filters.page ? parseInt(filters.page) : 1,
      limit: filters.limit ? parseInt(filters.limit) : 20
    })

    const where = {
      isVisible: true,
      ...(validatedFilters.sectors && {
        sector: {
          array_contains: validatedFilters.sectors
        }
      }),
      ...(validatedFilters.stages && {
        stage: {
          in: validatedFilters.stages
        }
      }),
      ...(validatedFilters.geos && {
        geo: {
          in: validatedFilters.geos
        }
      }),
      ...(validatedFilters.search && {
        name: {
          contains: validatedFilters.search,
          mode: 'insensitive'
        }
      })
    }

    const startups = await prisma.startup.findMany({
      where,
      include: {
        org: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      skip: (validatedFilters.page - 1) * validatedFilters.limit,
      take: validatedFilters.limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const total = await prisma.startup.count({ where })

    return NextResponse.json({
      startups,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total,
        pages: Math.ceil(total / validatedFilters.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching startups:', error)
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
    const validatedData = createStartupSchema.parse(body)

    // Get user's org (for now, use first org)
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

    const startup = await prisma.startup.create({
      data: {
        ...validatedData,
        orgId: userOrg.orgId,
        sector: JSON.stringify(validatedData.sector),
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

    return NextResponse.json(startup, { status: 201 })
  } catch (error) {
    console.error('Error creating startup:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}