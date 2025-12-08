# Prerequisite

- Docker
- Bun
- Supabase CLI

# Setup development server

## Setup local database server

```bash
supabase start
supabase db reset
```

In `Supabase > storage`, create bucket `avatars`, `clanPhotos`, `banners` for storing image and GIF (8mb max) and `songs` for level's song

## Run REST API server

Before running the following command, make sure to create a `.env` file at the project root and define all variable mentioned in `.env.example`.

```bash
bun install
bun run dev
```

Local development server is avaliable on `localhost:8080`. Documentation is avaliable at `/docs`.

# Deployment
## Deploy Supabase server

Follow [this tutorial](https://supabase.com/docs/guides/cli/local-development#deploy-your-project) from Supabase.

## Deploy REST API server

### Deploy with Cloudflare Workers

#### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.dev.vars` file from the example:
```bash
cp .dev.vars.example .dev.vars
```

3. Fill in your environment variables in `.dev.vars`

4. Run the development server:
```bash
npx wrangler dev
```

The server will be available at `http://localhost:8787`

#### Deploy to Cloudflare

1. Login to Cloudflare:
```bash
npx wrangler login
```

2. Configure your environment variables in Cloudflare Dashboard or use wrangler secrets:
```bash
npx wrangler secret put SUPABASE_API_KEY
npx wrangler secret put SUPABASE_API_URL
# ... repeat for other secrets
```

3. Deploy:
```bash
npx wrangler deploy
```

### Deploy with Docker container

#### Steps

- Use service like Azure container app or Google cloud run and deploy this docker container: `ghcr.io/nampe286/dlvn-api-v3-ghcr:latest`.
- Define all environment variable mentioned in `.env.example`.
- You are ready to go!
- Note: If you want to update the API, you have to pull new docker image manually.
