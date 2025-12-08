import type { Express, Request, Response } from "express";
import { swaggerHtml } from "../../static/swagger-html";

async function swaggerDocs(app: Express, port: number) {
  try {
    // Swagger page - serve pre-generated HTML
    app.get("/docs", (req: Request, res: Response) => {
      res.setHeader("Content-Type", "text/html");
      res.send(swaggerHtml);
    });

    console.log(`Docs available at /docs`);
  } catch (error) {
    // Swagger UI not available
    console.log('Swagger UI not available in this environment');
    console.error(error);
  }
}

export default swaggerDocs;