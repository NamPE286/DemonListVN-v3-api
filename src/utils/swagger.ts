import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function swaggerDocs(app: Express, port: number) {
  try {
    let swaggerSpec;
    
    // Try to load pre-compiled OpenAPI JSON file
    const preCompiledPath = path.join(__dirname, '../../static/openapi.json');
    if (fs.existsSync(preCompiledPath)) {
      console.log('Loading pre-compiled OpenAPI spec from static/openapi.json');
      swaggerSpec = JSON.parse(fs.readFileSync(preCompiledPath, 'utf-8'));
    } else {
      // Fall back to dynamic generation
      console.log('Pre-compiled OpenAPI spec not found, generating dynamically');
      const swaggerJsdoc = (await import("swagger-jsdoc")).default;
      
      const options = {
        definition: {
          openapi: "3.0.0",
          info: {
            title: "Demon List VN v3 REST API Docs",
            version: '1.0.0',
          },
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
              },
            },
          },
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
        apis: ["./src/routes/*.ts"],
      };

      swaggerSpec = swaggerJsdoc(options);
    }

    // Dynamically import swagger-ui-dist to get the path to static assets
    const swaggerUiDist = await import("swagger-ui-dist");
    const swaggerUiPath = swaggerUiDist.getAbsoluteFSPath();

    // Serve the OpenAPI spec at /docs/openapi.json
    app.get("/docs/openapi.json", (req: Request, res: Response) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    // Serve custom index.html that points to our OpenAPI spec (must be before static middleware)
    app.get("/docs", (req: Request, res: Response) => {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demon List VN v3 REST API Docs</title>
  <link rel="stylesheet" type="text/css" href="/docs/swagger-ui.css" />
  <link rel="icon" type="image/png" href="/docs/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="/docs/favicon-16x16.png" sizes="16x16" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; padding:0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="/docs/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    });

    // Serve Swagger UI static files (CSS, JS, images) - must be after /docs route
    app.use("/docs", express.static(swaggerUiPath));

    // Docs in JSON format (backwards compatibility)
    app.get("/docs.json", (req: Request, res: Response) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    console.log(`Docs available at /docs`);
  } catch (error) {
    // Swagger UI not available (e.g., in Cloudflare Workers)
    console.log('Swagger UI not available in this environment');
  }
}

export default swaggerDocs;