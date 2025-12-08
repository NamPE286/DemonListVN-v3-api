import type { Express, Request, Response } from "express";

async function swaggerDocs(app: Express, port: number) {
  try {
    // Dynamically import swagger modules - they use __dirname which isn't available in Workers
    const swaggerJsdoc = (await import("swagger-jsdoc")).default;
    const swaggerUi = (await import("swagger-ui-express")).default;

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

    const swaggerSpec = swaggerJsdoc(options);

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