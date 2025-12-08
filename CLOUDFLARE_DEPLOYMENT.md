# Cloudflare Workers Deployment Guide

This project has been configured to run on Cloudflare Workers. Here's what was done and how to use it.

## What Changed?

### 1. New Entry Point for Cloudflare Workers
- Added `src/worker.ts` - This is the Cloudflare Workers entry point that wraps the Express application
- The worker uses a custom adapter to convert between Cloudflare's Fetch API and Express's request/response model

### 2. Updated Configuration
- `wrangler.jsonc` - Configured with proper settings for Node.js compatibility
- `.dev.vars.example` - Template for local development environment variables

### 3. Code Modifications for Compatibility
- `src/client/GDApi.ts` - Lazy initialization to avoid runtime errors
- `src/client/sepay.ts` - Lazy initialization to avoid runtime errors  
- `src/utils/swagger.ts` - Made async and conditional for Workers environment
- Browser globals polyfills added in `worker.ts` for libraries that expect browser environment

## How to Use

### Local Development with Cloudflare Workers

1. Install dependencies:
```bash
npm install
```

2. Create environment variables file:
```bash
cp .dev.vars.example .dev.vars
```

3. Edit `.dev.vars` and add your actual environment variable values

4. Start the development server:
```bash
npx wrangler dev
```

The server will be available at `http://localhost:8787`

### Deploy to Cloudflare Workers

1. Login to Cloudflare:
```bash
npx wrangler login
```

2. Set up your secrets (environment variables):
```bash
npx wrangler secret put SUPABASE_API_KEY
npx wrangler secret put SUPABASE_API_URL
npx wrangler secret put JWT_SECRET
# ... etc for all required variables
```

3. Deploy:
```bash
npx wrangler deploy
```

### Traditional Node.js Development (Still Supported)

The original development workflow with Express still works:

1. Create a `.env` file from `.env.example`
2. Run `npm run dev`

## Architecture

The application now supports two deployment modes:

1. **Cloudflare Workers** (new):
   - Uses `src/worker.ts` as entry point
   - Runs on Cloudflare's edge network
   - Serverless, auto-scaling
   - Uses Fetch API

2. **Traditional Node.js** (existing):
   - Uses `src/index.ts` as entry point
   - Runs on a Node.js server
   - Uses Express's built-in HTTP server
   - Can be deployed via Docker or traditional hosting

## Important Notes

- **Swagger UI**: The `/docs` endpoint is not available in Cloudflare Workers due to file system limitations. However, the `/docs.json` endpoint should still work.
- **Environment Variables**: In Workers, environment variables are accessed via the `env` parameter in the fetch handler and are automatically injected into `process.env`
- **Lazy Initialization**: Some clients (GDApi, SePayPgClient) are now lazily initialized to avoid errors during module loading in Workers

## Dependencies

Added:
- `@whatwg-node/server` - Provides utilities for server adapters
- `@cloudflare/workers-types` (dev) - TypeScript types for Cloudflare Workers

## Troubleshooting

### Build Errors
If you get build errors when running `wrangler dev`:
1. Make sure all dependencies are installed: `npm install`
2. Check that your `.dev.vars` file exists and has valid values
3. Clear the wrangler cache: `rm -rf ~/.config/.wrangler`

### Runtime Errors
If the worker starts but requests fail:
1. Check the wrangler dev console output for error messages
2. Verify all required environment variables are set in `.dev.vars`
3. Test the same endpoint with the traditional Node.js server to isolate the issue

## File Reference

- `src/worker.ts` - Cloudflare Workers entry point and Express adapter
- `src/index.ts` - Traditional Express application (unchanged)
- `wrangler.jsonc` - Cloudflare Workers configuration
- `.dev.vars` - Local development environment variables (create from .dev.vars.example)
- `.dev.vars.example` - Template for environment variables
