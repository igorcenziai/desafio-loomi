;import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import type { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tintas MCP API",
      version: "1.0.0",
      description: "Documentação da API Tintas MCP",
    },
  },
  apis: ["./src/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
