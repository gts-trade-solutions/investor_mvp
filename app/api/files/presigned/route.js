export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { getPresignedUploadUrl, sanitizeFileName } from '@/lib/s3'

export async function POST(request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filename, contentType } = body

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename and content type are required' },
        { status: 400 }
      )
    }

    // Get user's org
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

    const sanitizedFilename = sanitizeFileName(filename)
    
    const presignedData = await getPresignedUploadUrl(
      sanitizedFilename,
      contentType,
      userOrg.orgId,
      session.user.id
    )

    return NextResponse.json(presignedData)
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}