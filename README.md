# API Server

REST API server built with Express.js, Cloudflare Workers, and Supabase.

## Prerequisites

- **Docker** - Required for running Supabase locally
- **Node.js** (v18+) - Runtime for Cloudflare Workers deployment
- **Supabase CLI** - For managing local Supabase instance

## Setup Development Server

### 1. Start Supabase (Docker Required)

The API requires a Supabase instance running locally via Docker. Start it with:

```bash
# Start Supabase services (PostgreSQL, Auth, Storage, etc. in Docker containers)
supabase start

# Reset the database to the latest migration
supabase db reset
```

> **Note:** `supabase start` uses Docker under the hood to spin up all required services (PostgreSQL, Auth, Storage, Studio, etc.). Make sure Docker is running before executing this command.

After Supabase starts, open the **Supabase Dashboard** (usually at `http://127.0.0.1:54323`) and navigate to **Storage**. Create the following buckets for image storage:
- `avatars` - User avatar images
- `clanPhotos` - Clan photo images
- `banners` - Banner images and GIFs (8MB max)
- `songs` - Level song audio files

### 2. Configure Environment Variables

Create a `.env` file at the project root:

```bash
cp .env.example .env
```

Fill in the required environment variables in `.env`:

```env
SUPABASE_API_KEY=your_supabase_service_role_key
SUPABASE_API_URL=http://127.0.0.1:54321
JWT_SECRET=your_jwt_secret
```

See `.env.example` for all available configuration options and their descriptions.

### 3. Install Dependencies and Run

```bash
# Install dependencies using npm
npm install

# Start the development server
npm run dev
```

The API server will be available at `http://localhost:8787`. API documentation (Swagger) is available at `/docs`.

## Useful Commands

```bash
# Generate TypeScript types from Supabase schema
npm run update-types

# Sync database migrations and regenerate types
npm run sync

# Generate Swagger documentation
npm run generate-docs

# Generate seed data for database
npm run generate-seed
```

## Project Structure

- `src/` - Source code
- `docs/` - Documentation
- `.env.example` - Example environment variables
- `wrangler.jsonc` - Cloudflare Workers configuration
- `package.json` - Dependencies and scripts
