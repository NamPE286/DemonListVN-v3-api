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

In `Supabase > storage`, create bucket `avatars` for player's avatar and `songs` for level's song

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

Use this method if you want a copy of the API and use it with your own database.

#### Steps

- Use service like Azure container app or Google cloud run and deploy this docker container: `ghcr.io/nampe286/dlvn-api-v3-ghcr:latest`.
- Define all environment variable mentioned in `.env.example`.
- You are ready to go!
- Note: If you want to update the API, you have to pull new docker image manually.

### Deploy modified version of this repo

Use this method if you want to make change to the source code.

#### Steps (for Azure)

- Create a new Azure Container App resource.
- Define all environment variable mentioned in `.env.example`.
- In Azure Container App resource page, go to Continuous Deployment and connect with your GitHub account (you may have to create a Container Registry before this step).
- You are ready to go!

Note: Other cloud platform (e.g: GCP, AWS, ...) usually have service equivalent to Azure Container App (e.g: Cloud Run in GCP, ...).