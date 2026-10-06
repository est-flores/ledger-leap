# LedgerLeap

A web app that turns PDF bank statements into Excel files, using GPT-4o Vision to extract the transactions.

## Status

This is an early prototype built in January 2026. It is not deployed and not in production.

## What works

- Sign-up and sign-in with Supabase Auth (email and password). A middleware refreshes the session and the dashboard redirects to sign-in when there is no user.
- A Postgres schema (`supabase/migrations/001_initial_schema.sql`) with `profiles` and `conversions` tables, row-level security on both, a trigger that creates a profile with 3 credits when a user signs up, and `add_credits` and `decrement_credit` functions.
- Uploading a PDF (or a PNG, JPG or WEBP image, up to 10 MB) from the browser to the `raw-files` Supabase Storage bucket, and recording a row in `conversions`.
- The `process-statement` Supabase edge function. It deducts one credit, downloads the uploaded file, sends it to the OpenAI chat completions API with the `gpt-4o` model, parses the returned transactions (date, description, withdrawal, deposit, balance), builds an XLSX file with ExcelJS, uploads it to the `results` bucket, marks the conversion as completed and returns a signed download URL valid for one hour.
- A dashboard that lists the user's 20 most recent conversions and shows their credit balance.

Credits can only be added by hand, for example with `SELECT add_credits('user-uuid', 10);` in the Supabase SQL editor.

## Not built yet

- Automatic deletion of uploaded files. Uploaded statements and generated spreadsheets stay in storage until removed by hand.
- Storage access policies. The bucket policies in the migration are commented out, so the `raw-files` and `results` buckets have to be created and secured by hand.
- Payments. `src/lib/services/pagalo.ts` is a standalone typed client for Guatemala's Págalo payment gateway and is not yet wired into the app.

## Stack

- Next.js 16.1.1 (App Router) with React 19.2.3
- TypeScript 5
- Tailwind CSS 4, Radix UI primitives, lucide-react icons
- Supabase: `@supabase/supabase-js` 2.89 and `@supabase/ssr` 0.8 (Auth, Postgres, Storage, Edge Functions)
- OpenAI GPT-4o, called from a Deno edge function
- ExcelJS 4.4
- react-dropzone 14.3 for uploads
- Firebase 12.7 for optional analytics

## Running it locally

You need Node.js, a Supabase project, the Supabase CLI and an OpenAI API key.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values. The Next.js app reads:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Optional, for Firebase Analytics
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

   # Only read by the unused Pagalo client
   PAGALO_API_KEY=your-pagalo-api-key
   PAGALO_API_URL=https://apitest.pagalo.co/v1
   ```

   The edge function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which Supabase provides automatically, and `OPENAI_API_KEY`, which you set as a secret in step 4.

3. Apply the migration. Either run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor, or link the project and push it:

   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

   Then create two private storage buckets in the Supabase dashboard: `raw-files` and `results`.

4. Deploy the edge function:

   ```bash
   supabase secrets set OPENAI_API_KEY=your-openai-api-key
   supabase functions deploy process-statement
   ```

5. Start the dev server and open http://localhost:3000:

   ```bash
   npm run dev
   ```
