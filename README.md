# DemonListVN v3 API

REST API server for DemonListVN v3 built with Express.js and TypeScript, following MVC architectural pattern.

## Architecture

This project follows the **Model-View-Controller (MVC)** pattern for better separation of concerns:

- **Routes** (`src/routes/`): Define API endpoints and middleware
- **Controllers** (`src/controllers/`): Handle HTTP requests/responses
- **Services** (`src/services/`): Contain business logic
- **Models** (`src/lib/classes/`, `src/lib/client/`): Data access layer

📚 See [MVC_ARCHITECTURE.md](./MVC_ARCHITECTURE.md) for detailed documentation
📚 See [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) for refactoring guidelines

## Prerequisite

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

### Deploy with Docker container

#### Steps

- Use service like Azure container app or Google cloud run and deploy this docker container: `ghcr.io/nampe286/dlvn-api-v3-ghcr:latest`.
- Define all environment variable mentioned in `.env.example`.
- You are ready to go!
- Note: If you want to update the API, you have to pull new docker image manually.
