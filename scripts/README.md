# Swagger Documentation Generation

This directory contains scripts for generating pre-built Swagger API documentation.

## Generate Swagger Documentation

To generate the Swagger documentation HTML file, run:

```bash
npm run generate-docs
```

This script will:

1. Parse all route files in `src/routes/*.ts` for Swagger JSDoc annotations
2. Generate a complete OpenAPI specification
3. Create a standalone HTML file with the Swagger UI at `static/swagger.html`
4. Create a TypeScript module at `static/swagger-html.ts` that exports the HTML as a string (used by the server)

## Output Files

The script generates the following files:

- **`static/swagger.html`**: A standalone HTML file that can be opened directly in a browser
- **`static/swagger-html.ts`**: A TypeScript module that exports the HTML content as a string, which is imported by the server

## Usage

After generating the documentation, the `/docs` route will serve the pre-generated HTML file.

Access the documentation at: `http://localhost:8787/docs` (or your deployed URL)

## When to Regenerate

You should regenerate the documentation when:

- Adding new API endpoints
- Updating existing endpoint documentation
- Changing API parameters or responses
- Updating the API version or title

## How it Works

The script uses:

- **swagger-jsdoc**: Parses JSDoc comments from route files to generate OpenAPI specification
- **Swagger UI Standalone**: Provides the interactive API documentation interface
- The generated HTML is embedded into a TypeScript module for easy deployment in Cloudflare Workers environment

## Note

The generated files (`static/swagger.html` and `static/swagger-html.ts`) are committed to the repository and NOT gitignored, so they are available in production deployments.
