import { z } from 'zod'
import { SECTORS, STAGES, GEOS } from '@/lib/utils'

// User schemas
export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['FOUNDER', 'INVESTOR']).default('FOUNDER')
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  image: z.string().url().optional()
})

// Org schemas
export const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
})

export const inviteToOrgSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER')
})

// Startup schemas
export const createStartupSchema = z.object({
  name: z.string().min(2, 'Startup name must be at least 2 characters'),
  sector: z.array(z.enum(SECTORS)).min(1, 'Select at least one sector'),
  stage: z.enum(STAGES),
  geo: z.enum(GEOS),
  website: z.string().url().optional().or(z.literal('')),
  mrr: z.number().min(0).optional(),
  teamSize: z.number().min(1).optional(),
  isVisible: z.boolean().default(true)
})

export const updateStartupSchema = createStartupSchema.partial()

// Investor schemas  
export const createInvestorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  title: z.string().optional(),
  sectors: z.array(z.enum(SECTORS)).min(1, 'Select at least one sector'),
  stages: z.array(z.enum(STAGES)).min(1, 'Select at least one stage'),
  geos: z.array(z.enum(GEOS)).min(1, 'Select at least one geography'),
  notes: z.string().optional()
})

export const updateInvestorSchema = createInvestorSchema.partial()

// Fund schemas
export const createFundSchema = z.object({
  name: z.string().min(2, 'Fund name must be at least 2 characters'),
  checkSizeMin: z.number().min(1, 'Minimum check size must be greater than 0'),
  checkSizeMax: z.number().min(1, 'Maximum check size must be greater than 0'),
  sector: z.array(z.enum(SECTORS)).min(1, 'Select at least one sector'),
  stage: z.array(z.enum(STAGES)).min(1, 'Select at least one stage'),
  geo: z.array(z.enum(GEOS)).min(1, 'Select at least one geography'),
  website: z.string().url().optional().or(z.literal(''))
})

export const updateFundSchema = createFundSchema.partial()

// Opportunity schemas
export const createOpportunitySchema = z.object({
  startupId: z.string().cuid(),
  investorId: z.string().cuid().optional(),
  fundId: z.string().cuid().optional(),
  stage: z.enum(['TO_CONTACT', 'CONTACTED', 'MEETING', 'DILIGENCE', 'COMMITTED', 'LOST']).default('TO_CONTACT'),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
})

export const updateOpportunitySchema = z.object({
  stage: z.enum(['TO_CONTACT', 'CONTACTED', 'MEETING', 'DILIGENCE', 'COMMITTED', 'LOST']).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
})

// Activity schemas
export const createActivitySchema = z.object({
  opportunityId: z.string().cuid(),
  type: z.string(),
  note: z.string().optional()
})

// Program schemas
export const createProgramSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  tags: z.array(z.string()).optional().default([]),
  applicationDeadline: z.date().optional()
})

export const updateProgramSchema = createProgramSchema.partial()

// Application schemas
export const createApplicationSchema = z.object({
  programId: z.string().cuid(),
  startupId: z.string().cuid()
})

export const updateApplicationSchema = z.object({
  status: z.enum(['NEW', 'IN_REVIEW', 'ACCEPTED', 'REJECTED', 'WAITLIST']).optional(),
  score: z.number().min(0).max(100).optional(),
  assignedReviewerId: z.string().cuid().optional()
})

// File schemas
export const uploadFileSchema = z.object({
  key: z.string().min(1),
  bucket: z.string().min(1),
  region: z.string().min(1),
  etag: z.string().optional(),
  size: z.number().min(1),
  mime: z.string().min(1),
  folderId: z.string().optional()
})

// Search/Filter schemas
export const startupFilterSchema = z.object({
  sectors: z.array(z.enum(SECTORS)).optional(),
  stages: z.array(z.enum(STAGES)).optional(),
  geos: z.array(z.enum(GEOS)).optional(),
  mrrMin: z.number().optional(),
  mrrMax: z.number().optional(),
  teamSizeMin: z.number().optional(),
  teamSizeMax: z.number().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20)
})

export const investorFilterSchema = z.object({
  sectors: z.array(z.enum(SECTORS)).optional(),
  stages: z.array(z.enum(STAGES)).optional(),
  geos: z.array(z.enum(GEOS)).optional(),
  checkSizeMin: z.number().optional(),
  checkSizeMax: z.number().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20)
})