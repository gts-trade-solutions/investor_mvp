# InvestMatch - Investor-Startup Matchmaking Platform

A full-featured investor-startup matchmaking platform built with Next.js 14, featuring real-time collaboration, secure file sharing, and comprehensive pipeline management.

## 🚀 Features

### For Founders
- **Smart Investor Discovery** - Find investors based on sector, stage, and geography
- **Pipeline Management** - Visual Kanban boards to track fundraising progress
- **Pitch Deck Analytics** - Track engagement and viewing patterns
- **Secure Data Room** - Share sensitive documents with granular permissions
- **Warm Introductions** - Request introductions through your network
- **Investor Updates** - Keep stakeholders informed with regular updates

### For Investors  
- **Startup Directory** - Browse and filter promising startups
- **Deal Pipeline** - Manage opportunities from first contact to closing
- **Programs & Applications** - Run accelerator programs and competitions
- **Portfolio Analytics** - Track investment performance and metrics

### For Admins
- **Platform Management** - User, organization, and content moderation
- **Analytics Dashboard** - Platform-wide metrics and insights
- **Program Management** - Create and manage accelerator programs

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL (PlanetScale compatible)
- **Authentication**: NextAuth.js v4 with JWT sessions
- **File Storage**: AWS S3 with presigned URLs
- **PDF Viewer**: PDF.js with analytics
- **Email**: Resend
- **Language**: JavaScript only (no TypeScript)

## 📋 Prerequisites

- Node.js 18+ 
- MySQL database (PlanetScale recommended)
- AWS S3 bucket for file storage
- OAuth provider credentials (Google, GitHub)
- Resend account for emails

## 🏃‍♂️ Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd investor-startup-platform
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="mysql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers  
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# S3 Storage
S3_ACCESS_KEY_ID="your-s3-access-key"
S3_SECRET_ACCESS_KEY="your-s3-secret-key"  
S3_BUCKET="your-bucket-name"
S3_REGION="us-east-1"

# Email
RESEND_API_KEY="your-resend-api-key"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database  
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. PDF.js Worker Setup
```bash
# Copy PDF.js worker to public directory
npm run setup-pdf-worker
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🗄 Database Schema

### Core Entities
- **Users** - Platform users (founders, investors, admins)
- **Organizations** - Companies, funds, and other entities
- **Startups** - Companies seeking investment
- **Investors** - Investment professionals and funds
- **Opportunities** - Investment connections and pipeline items
- **Programs** - Accelerator programs and competitions

### Key Features
- Multi-tenant architecture with organization scoping
- Row-level security with Prisma relations
- Comprehensive indexing for performance
- Audit trails for sensitive operations

## 🔐 Authentication & Authorization

### Providers
- **Credentials** - Email/password with bcrypt hashing
- **Google OAuth** - Sign in with Google account  
- **GitHub OAuth** - Sign in with GitHub account

### Role-Based Access Control (RBAC)
- **Founders** - Access founder portal and startup management
- **Investors** - Access investor portal and deal pipeline
- **Admins** - Full platform access and moderation tools

### Security Features
- JWT-based sessions with NextAuth.js
- Rate limiting on API endpoints
- CSRF protection on forms
- File access scoped to organizations

## 📁 File Storage & Security

### AWS S3 Integration
- **Presigned URLs** - Direct client uploads without server proxy
- **Scoped Keys** - Files organized by `orgId/userId/filename`
- **Size Limits** - 25MB per file (configurable)
- **Type Validation** - Whitelist of allowed MIME types

### Data Room Permissions
- **Granular Access** - Per-file permissions for users/emails
- **View/Download Controls** - Separate permissions for viewing vs downloading
- **Audit Trail** - Log all file access and permission changes

## 📊 PDF Viewer & Analytics

### PDF.js Integration
- **Worker Setup** - Dedicated worker thread for PDF processing
- **Page Thumbnails** - Navigate large documents easily
- **Mobile Responsive** - Works on all device sizes

### Deck Analytics
- **View Tracking** - Page-level viewing time and engagement
- **Debounced Events** - Maximum 1 event per 5 seconds to prevent spam
- **Visitor Analytics** - IP and user agent tracking (privacy-compliant)
- **Engagement Metrics** - Total time spent, pages viewed, return visits

## 🏗 Architecture & Organization

### File Structure
```
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API route handlers
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
├── prisma/              # Database schema and migrations
├── hooks/               # Custom React hooks
└── public/              # Static assets
```

### Code Organization
- **Separation of Concerns** - Clear boundaries between UI, business logic, and data
- **Modular Components** - Reusable components under 200 lines
- **Server/Client Split** - Proper use of server and client components
- **Type Safety** - Zod schemas for runtime validation

## 🚀 Deployment

### Environment Requirements
- Node.js 18+ runtime
- MySQL database with connection pooling
- S3-compatible object storage
- Redis for rate limiting (production)

### Build Configuration
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Database Migration
```bash
# Push schema changes
npm run db:push

# Reset and reseed (development only)
npm run db:reset && npm run db:seed
```

## 🔧 Configuration

### Rate Limiting
Current implementation uses in-memory storage for development. For production, replace with Redis-based implementation in `lib/rate-limit.js`.

### Email Configuration
Uses Resend for transactional emails. Configure templates for:
- Welcome emails
- Password resets  
- Introduction requests
- Investor updates

### S3 Configuration
1. Create S3 bucket with CORS enabled
2. Configure IAM user with S3 permissions
3. Set up CloudFront distribution (optional)
4. Update environment variables

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

#### GitHub OAuth  
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://yourdomain.com/api/auth/callback/github` (production)

## 🧪 Development

### Code Quality
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **Git Hooks** - Pre-commit formatting and linting

### Database Development
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (destructive)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy
```

### Testing Accounts
After seeding, you can use these test accounts:

- **Admin**: admin@investmatch.com / password123
- **Founder**: founder@startup.com / password123  
- **Investor**: investor@vc.com / password123

## 📝 API Documentation

### Authentication Required
All API routes under `/api/` (except auth) require valid session.

### Rate Limiting
- **GET requests**: Unlimited
- **POST/PUT/DELETE**: 10 requests per minute per IP/user

### Key Endpoints
- `POST /api/startups` - Create startup
- `GET /api/startups` - List startups with filtering
- `POST /api/opportunities` - Create investment opportunity
- `PUT /api/opportunities/[id]` - Update opportunity stage
- `POST /api/files/presigned` - Get presigned upload URL

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, email support@investmatch.com or create an issue in the repository.

---

**Note**: This is a production-ready application with real database integration, authentication, and file storage. Ensure proper security measures are in place before deploying to production.