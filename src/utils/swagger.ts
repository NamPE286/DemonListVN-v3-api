import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function swaggerDocs(app: Express, port: number) {
  try {
    // Dynamically import swagger modules - they use __dirname which isn't available in Workers
    const swaggerUi = (await import("swagger-ui-express")).default;

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

    // Swagger page
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Docs in JSON format
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