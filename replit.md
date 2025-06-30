# AutoMarketer - Replit.md

## Overview

AutoMarketer is an autonomous marketing system that generates and distributes content across multiple platforms using AI. The application is built as a full-stack web application with a React frontend and Express.js backend, designed to help users create marketing campaigns that operate independently and continuously generate engagement across various channels.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **AI Integration**: OpenAI GPT-4 for content generation and strategy creation

### Key Components

#### Authentication System
- Uses Replit's OpenID Connect for user authentication
- Session-based authentication with PostgreSQL session storage
- User profiles stored with basic information (email, name, profile image)

#### Campaign Management
- Full CRUD operations for marketing campaigns
- AI-powered strategy generation based on product descriptions
- Support for multiple target platforms (LinkedIn, Twitter, Reddit, Medium, etc.)
- Campaign status tracking (active, paused, completed)

#### Content Generation & Scheduling
- AI-powered content creation for different platforms and formats
- Content calendar with scheduling capabilities
- Autonomous content publishing with cron-based scheduler
- Multi-format support (social posts, blog articles, email campaigns)

#### Analytics & Monitoring
- Dashboard with key performance metrics
- Activity tracking for all system actions
- Performance analytics by platform and content type
- Lead capture and management

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating a session stored in PostgreSQL
2. **Campaign Creation**: Users input product descriptions, which are processed by OpenAI to generate marketing strategies
3. **Content Generation**: AI creates platform-specific content based on campaign parameters
4. **Content Scheduling**: Content is scheduled for publication across target platforms
5. **Autonomous Operation**: Cron jobs handle scheduled content publishing and performance monitoring
6. **Analytics Collection**: System tracks engagement metrics and stores them for dashboard display

## External Dependencies

### Core Dependencies
- **OpenAI API**: For AI-powered content generation and strategy creation
- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit Services**: Authentication and deployment infrastructure

### NPM Packages
- **Database**: `drizzle-orm`, `@neondatabase/serverless`, `connect-pg-simple`
- **Authentication**: `passport`, `openid-client`, `express-session`
- **AI Integration**: `openai`
- **Scheduling**: `node-cron`
- **UI Library**: Multiple `@radix-ui` components, `lucide-react`
- **Form Handling**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Utilities**: `date-fns`, `clsx`, `tailwind-merge`

## Deployment Strategy

### Development Environment
- Vite development server with HMR for frontend
- tsx for TypeScript execution in development
- Automatic Replit integration with cartographer plugin

### Production Build
- Frontend: Vite build output to `dist/public`
- Backend: esbuild bundle to `dist/index.js`
- Single deployment artifact with Express serving both API and static files

### Database Management
- Drizzle Kit for schema management and migrations
- Environment-based database URL configuration
- Automatic session table creation for authentication

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API access key
- `SESSION_SECRET`: Express session encryption secret
- `REPL_ID`: Replit environment identifier

## Autonomous Engine Architecture

### Sophisticated Timing and Feedback System
AutoMarketer implements a sophisticated autonomous marketing engine based on platform-specific timing sequences and multi-sweep feedback cycles to prevent premature optimization and maximize engagement.

#### Campaign Lifecycle Phases
1. **Initialization (Immediate)**: Campaign created with UUID and tracking setup
2. **Strategy Generation (<1 minute)**: AI generates audience map, UVP, channel selection, KPIs
3. **Content Generation (1-3 minutes)**: Multi-format content creation with A/B variants
4. **Validation (0-10 minutes)**: Optional compliance and brand review
5. **Distribution (0-90 minutes)**: Staggered, randomized content publishing
6. **Feedback Collection**: Platform-specific cooldown and multi-sweep cycles
7. **Learning Loop**: AI optimization every 24h or on critical events
8. **Continuous Operation**: Autonomous content creation and optimization

#### Platform-Specific Feedback Windows
- **Social Platforms**: 45min cooldown → 2h, 2h, 2h, 24h, daily sweeps
- **Blog Platforms**: 2h cooldown → 6h, 24h, daily sweeps  
- **Forum Platforms**: 1h cooldown → 6h, 24h, daily sweeps
- **Email Campaigns**: 2h cooldown → 12h, 24h, daily sweeps

#### Key Principles
- No premature optimization before sufficient signal maturity
- Content mutations only after platform-specific data collection
- Autonomous adaptation based on quantitative feedback, not random chance
- Closed-loop AI improvement with backtracking and memory retention

### Technical Implementation
- **AutonomousMarketingEngine**: Core engine with state management and timing logic
- **Multi-sweep feedback collection**: Platform-specific timing patterns
- **Learning bank**: AI memory system for optimization patterns
- **Emergency stop capability**: Manual intervention controls
- **Real-time monitoring**: Dashboard with engine status and performance metrics

## Changelog

```
Changelog:
- June 30, 2025. Initial setup with autonomous engine implementation
- June 30, 2025. Implemented sophisticated timing sequences and feedback logic
- June 30, 2025. Added autonomous engine monitoring dashboard
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```