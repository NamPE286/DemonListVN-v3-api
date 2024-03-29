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

In Supabase > storage, create bucket `avatars` for player's avatar and `songs` for level's song

## Run REST API server

Before running the following command, make sure to create a `.env` file at the project root and define all variable mentioned in `.env.example`.

```bash
bun install
bun run dev
```

Local development server is avaliable on `localhost:8080`. Documentation is avaliable at `/docs`.

# Deployment
## Deploy Supabase server

Follow [this tutorial](https://supabase.com/docs/guides/cli/local-development) from Supabase.

## Deploy REST API server

### Deploy with Docker container

Use this method if you want a identical copy and stay up to date with this repo.

#### Steps

- Use service like Azure container app or Google cloud run and deploy this docker image `ghcr.io/nampe286/dlvn-api-v3-ghcr:latest`
- Define all environment variable mentioned in `.env.example`
- You are ready to go!

### Deploy modified version of this repo

Use this method if you want to make change to the source code.

#### Steps

- Define `GH_PAT` repo action secret. This is your GitHub personal access token. This token must support action read, write and delete.

