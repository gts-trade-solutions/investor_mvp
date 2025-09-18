let PrismaClient

try {
  PrismaClient = require('@prisma/client').PrismaClient
} catch (error) {
  // Fallback for environments where Prisma client is not available
  console.warn('Prisma client not available, using mock client')
  PrismaClient = class MockPrismaClient {
    constructor() {
      // Mock all Prisma models
      const mockModel = {
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        findFirst: () => Promise.resolve(null),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve({}),
        count: () => Promise.resolve(0),
        createMany: () => Promise.resolve({ count: 0 }),
        updateMany: () => Promise.resolve({ count: 0 }),
        deleteMany: () => Promise.resolve({ count: 0 }),
        upsert: () => Promise.resolve({})
      }
      
      this.user = mockModel
      this.org = mockModel
      this.orgMember = mockModel
      this.startup = mockModel
      this.fund = mockModel
      this.investor = mockModel
      this.opportunity = mockModel
      this.activity = mockModel
      this.submission = mockModel
      this.deckLink = mockModel
      this.viewEvent = mockModel
      this.dataRoomPermission = mockModel
      this.program = mockModel
      this.application = mockModel
      this.review = mockModel
      this.perk = mockModel
      this.update = mockModel
      this.intro = mockModel
      this.savedList = mockModel
      this.savedListItem = mockModel
      this.notification = mockModel
      this.fileObject = mockModel
      this.emailVerificationToken = mockModel
      this.passwordResetToken = mockModel
      this.$disconnect = () => Promise.resolve()
    }
  }
}

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma