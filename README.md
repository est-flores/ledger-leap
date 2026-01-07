# LedgerLeap

A secure, pay-per-use SaaS that converts PDF Bank Statements into formatted
Excel/CSV files using AI.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## Features

- 🚀 **AI-Powered Extraction** - Uses GPT-4o Vision to extract transactions from
  bank statements
- 📊 **Excel Output** - Get clean, formatted XLSX files with proper column
  structure
- 🔐 **Secure** - Row Level Security, encrypted storage, auto-deletion after 24h
- 💳 **Credit System** - Pay-per-use model with manual credit top-up

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions)
- **AI:** OpenAI GPT-4o Vision
- **Excel:** ExcelJS

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ledger-leap
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Firebase Analytics (optional - events log to console in dev mode)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Create storage buckets:
   - `raw-files` (private) - for uploaded PDFs
   - `results` (private) - for generated XLSX files

### 4. Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set OPENAI_API_KEY=your_openai_key

# Deploy function
supabase functions deploy process-statement
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ledger-leap/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (sign-in, sign-up)
│   │   ├── dashboard/          # Protected dashboard
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Landing page
│   │   ├── sitemap.ts          # SEO sitemap
│   │   └── robots.ts           # SEO robots.txt
│   ├── components/             # React components
│   │   ├── ui/                 # Shadcn/UI components
│   │   ├── upload-zone.tsx     # File upload component
│   │   ├── navbar.tsx          # Navigation bar
│   │   └── footer.tsx          # Footer
│   ├── context/                # React contexts
│   │   └── auth-context.tsx    # Auth state management
│   ├── lib/                    # Utilities
│   │   └── supabase/           # Supabase clients
│   └── types/                  # TypeScript types
│       └── database.types.ts   # Supabase schema types
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── functions/              # Edge Functions
│       └── process-statement/  # PDF processing function
└── middleware.ts               # Auth middleware
```

## Credit Management

Credits are managed manually via SQL:

```sql
-- Add 10 credits to a user
SELECT add_credits('user-uuid-here', 10);

-- Check user's balance
SELECT credits_balance FROM profiles WHERE id = 'user-uuid-here';
```

## Storage Lifecycle (Manual Setup)

For auto-deletion of files after 24h, set up a scheduled Edge Function or use
Supabase Dashboard to configure lifecycle rules on the `raw-files` bucket.

## License

MIT
