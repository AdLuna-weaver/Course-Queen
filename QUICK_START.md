# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Environment Setup ✅

Your Supabase credentials are already configured in `.env.local`:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
```

**Still needed:**
- `ANTHROPIC_API_KEY` - Get from [console.anthropic.com](https://console.anthropic.com)
- `OPENAI_API_KEY` - Get from [platform.openai.com](https://platform.openai.com)

### 2. Database Setup

Follow the instructions in [DATABASE_SETUP.md](./DATABASE_SETUP.md):

1. Enable pgvector extension in Supabase
2. Run the migration from `supabase/migrations/001_initial_schema.sql`
3. Create your first user in Supabase Auth
4. Insert a profile record

### 3. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 4. Test the Setup

1. **Home Page**: [http://localhost:3000](http://localhost:3000)
2. **Login Page**: [http://localhost:3000/login](http://localhost:3000/login)
3. **Courses Dashboard**: [http://localhost:3000/courses](http://localhost:3000/courses)

## 📁 Project Structure Overview

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Main app (courses, resources, settings)
│   ├── api/               # API routes (ready for implementation)
│   └── page.tsx           # Landing page
│
├── components/
│   ├── ui/                # shadcn/ui components (Button, Card, etc.)
│   ├── wizard/            # 7-phase course creation wizard (TODO)
│   ├── review/            # Review and commenting system (TODO)
│   ├── resources/         # Resource management (TODO)
│   └── course/            # Course editing components (TODO)
│
├── lib/
│   ├── supabase/          # ✅ Database clients
│   ├── ai/                # ✅ Claude & OpenAI integrations
│   │   ├── anthropic.ts   # Claude Sonnet 4.5 client
│   │   ├── embeddings.ts  # OpenAI embeddings
│   │   ├── rag.ts         # RAG implementation
│   │   └── prompts.ts     # Prompt templates
│   ├── parsers/           # ✅ PDF, DOCX, XLSX parsers
│   ├── utils/             # ✅ Helper functions
│   └── types/             # ✅ TypeScript definitions
│
└── stores/                # Zustand state management (TODO)
```

## 🎯 Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Project setup
- [x] Database schema
- [x] Supabase integration
- [x] AI utilities (Claude, OpenAI, RAG)
- [x] File parsers (PDF, DOCX, XLSX)
- [x] Base UI components
- [x] Build configuration
- [x] Type definitions

### Phase 2: Core Features (Next Steps)

#### 2.1 Authentication
- [ ] Implement signup flow
- [ ] Implement login flow
- [ ] Add session management
- [ ] Create protected routes

#### 2.2 Course Management
- [ ] Course list page with real data
- [ ] Create new course form
- [ ] Course detail view
- [ ] Module and lesson management

#### 2.3 7-Phase Wizard
- [ ] Phase 1: Idea Capture
- [ ] Phase 2: Resource & Team Assembly
- [ ] Phase 3: Branding & Style
- [ ] Phase 4: AI-Generated Outline
- [ ] Phase 5: SME Questions
- [ ] Phase 6: Final Outline Refinement
- [ ] Phase 7: Content Generation

#### 2.4 Resource Management
- [ ] File upload component
- [ ] Resource library view
- [ ] File parsing integration
- [ ] RAG processing pipeline

### Phase 3: AI Integration
- [ ] Implement outline generation API
- [ ] Implement content generation API
- [ ] Implement question generation API
- [ ] Add streaming responses
- [ ] Cost tracking dashboard

### Phase 4: Collaboration
- [ ] Real-time commenting system
- [ ] Team member management
- [ ] Review workflow
- [ ] Notifications

### Phase 5: Advanced Features
- [ ] Version control and diffs
- [ ] Export to various formats
- [ ] Analytics dashboard
- [ ] Template library

## 🧪 Testing the AI Features

Once you add your API keys, you can test the AI utilities:

```typescript
// In a server component or API route
import { sendClaudeMessage } from '@/lib/ai/anthropic';

const response = await sendClaudeMessage(
  [{ role: 'user', content: 'Generate a course outline for...' }],
  'You are an expert instructional designer.'
);

console.log(response.content);
console.log(`Cost: $${response.cost.toFixed(4)}`);
```

## 📊 Database Tables

Available tables (see full schema in `supabase/migrations/001_initial_schema.sql`):

- `companies` - Organization info and branding
- `profiles` - User profiles (extends auth.users)
- `courses` - Course metadata and status
- `course_team` - Team member assignments
- `resources` - Uploaded files and URLs
- `embeddings` - Vector embeddings for RAG
- `modules` - Course modules
- `lessons` - Lesson content
- `questions` - Assessment questions
- `comments` - Review comments
- `sme_questions` - Questions for subject matter experts
- `cost_tracking` - AI usage costs
- `wizard_phases` - Wizard progress data

## 🔑 API Keys Needed

### Anthropic (Required for AI generation)
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add to `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`

**Pricing**: $3/M input tokens, $15/M output tokens

### OpenAI (Required for embeddings/RAG)
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add to `.env.local`: `OPENAI_API_KEY=sk-...`

**Pricing**: $0.02/M tokens (embeddings)

## 💡 Tips

- Use the Supabase dashboard to view and edit data
- Check cost tracking in the `cost_tracking` table
- RLS policies are enabled - test with real auth users
- Use the SQL editor to run queries and test the search function
- Vector search requires pgvector extension

## 🐛 Common Issues

### Build fails
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Database connection fails
- Check your `.env.local` credentials
- Verify Supabase project is active
- Test connection in Supabase dashboard

### AI features don't work
- Verify API keys are set correctly
- Check API key quotas/credits
- Review server logs for errors

## 📚 Documentation

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Anthropic API](https://docs.anthropic.com)
- [OpenAI API](https://platform.openai.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🚢 Ready to Deploy?

### Vercel (Recommended)
1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Cloudflare Pages
1. Connect GitHub repo
2. Build: `npm run build`
3. Output: `.next`
4. Add environment variables
5. Deploy

---

**Need help?** Check the README.md or create an issue in the repository.
