# Course Planner

An AI-powered course development platform that helps organizations create high-quality training courses efficiently using Claude Sonnet 4.5 and modern web technologies.

## Features

- **7-Phase Wizard**: Structured course creation workflow
  - Phase 1: Idea Capture
  - Phase 2: Resource & Team Assembly
  - Phase 3: Branding & Style
  - Phase 4: AI-Generated Outline
  - Phase 5: SME Questions
  - Phase 6: Final Outline Refinement
  - Phase 7: Content Generation

- **AI-Powered Generation**: Leverages Claude Sonnet 4.5 for intelligent content creation
- **RAG (Retrieval-Augmented Generation)**: Uses pgvector for semantic search across course resources
- **Real-time Collaboration**: Multi-user review and commenting system
- **Resource Management**: Upload and parse PDF, DOCX, and XLSX files
- **Cost Tracking**: Monitor AI API usage and costs per course
- **Version Control**: Track changes and consolidate feedback

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Zustand** for state management

### Backend
- **Next.js API Routes** for serverless functions
- **tRPC** for type-safe APIs
- **Supabase** for:
  - PostgreSQL database
  - Authentication
  - File storage
  - Real-time subscriptions
  - pgvector for embeddings

### AI & ML
- **Claude Sonnet 4.5** (Anthropic) for content generation
- **OpenAI text-embedding-3-small** for semantic search
- Custom RAG implementation

### Hosting
- **Vercel** or **Cloudflare Pages** for frontend
- **Supabase** for backend services

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key (for Claude)
- OpenAI API key (for embeddings)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Course-Queen
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable the pgvector extension:
   - Go to Database → Extensions
   - Search for "vector" and enable it
3. Run the migration:
   - Go to SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the SQL

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Services
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key

# Optional: If using service role key for admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
course-planner/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Dashboard and main app pages
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── wizard/            # Wizard phase components
│   │   ├── review/            # Review mode components
│   │   ├── resources/         # Resource management
│   │   └── course/            # Course editing components
│   ├── lib/                   # Utility libraries
│   │   ├── supabase/          # Supabase clients
│   │   ├── ai/                # AI utilities
│   │   ├── parsers/           # File parsers
│   │   ├── utils/             # Helper functions
│   │   └── types/             # TypeScript types
│   └── stores/                # Zustand stores
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Seed data
└── public/                    # Static assets
```

## Key Features Implementation

### AI Content Generation

The application uses Claude Sonnet 4.5 for:
- Course outline generation
- Lesson content creation
- Assessment question generation
- Feedback consolidation
- Content updates

Example usage:

```typescript
import { sendClaudeMessage } from '@/lib/ai/anthropic';

const response = await sendClaudeMessage(
  [{ role: 'user', content: 'Generate a course outline for...' }],
  systemPrompt
);
```

### RAG (Retrieval-Augmented Generation)

The application uses pgvector and OpenAI embeddings to:
1. Process uploaded resources (PDF, DOCX, XLSX)
2. Generate embeddings for text chunks
3. Search for relevant context when generating content

Example usage:

```typescript
import { searchRelevantContent, buildRAGContext } from '@/lib/ai/rag';

const context = await buildRAGContext(
  'What are the best practices for...',
  courseId
);
```

### Database Schema

The database includes tables for:
- Companies and user profiles
- Courses and course teams
- Modules, lessons, and questions
- Resources and embeddings
- Comments and reviews
- Cost tracking

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] Database schema
- [x] Authentication
- [x] Basic UI components

### Phase 2: Core Features (In Progress)
- [ ] Course wizard implementation
- [ ] AI integration
- [ ] Resource upload and parsing
- [ ] RAG implementation

### Phase 3: Collaboration
- [ ] Real-time commenting
- [ ] Team management
- [ ] Review workflow
- [ ] Version control

### Phase 4: Advanced Features
- [ ] tRPC API layer
- [ ] Advanced analytics
- [ ] Export functionality
- [ ] Template library

## API Costs

The application uses two AI services:

- **Claude Sonnet 4.5**: $3/M input tokens, $15/M output tokens
- **OpenAI Embeddings**: $0.02/M tokens

Cost tracking is built-in and stored per course in the `cost_tracking` table.

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Cloudflare Pages

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variables
5. Deploy

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the development team

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Backend by [Supabase](https://supabase.com/)
