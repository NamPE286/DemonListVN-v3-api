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

Use this method if you want a identical copy with your own database and stay up to date with this repo.

#### Steps

- Use service like Azure container app or Google cloud run and deploy this docker container: `ghcr.io/nampe286/dlvn-api-v3-ghcr:latest`.
- Define all environment variable mentioned in `.env.example`.
- You are ready to go!

### Deploy modified version of this repo

Use this method if you want to make change to the source code.

#### Steps

- Define `GH_PAT` repo action secret. This is your GitHub personal access. token. This token must support action read, write and delete.
- Clone the source code and in source code directory, run this following command:
```bash
# Login to container registry
docker login --username YOUR_GITHUB_USERNAME --password YOUR_GITHUB_PERSONAL_ACCESS_TOKEN

# Build and tag image
docker build . -t ghcr.io/YOUR_GITHUB_USERNAME/YOUR_CONTAINER_NAME:latest

# Push the container
docker push ghcr.io/YOUR_GITHUB_USERNAME/YOUR_CONTAINER_NAME:latest
```
- In build and publish workflows, replace my username (nampe286) to your username and replace `ghcr.io/nampe286/dlvn-api-v3-ghcr:latest` with your container url.
- Use service like Azure container app or Google cloud run and deploy your docker container.
- Define all environment variable mentioned in `.env.example`.
- You are ready to go!
