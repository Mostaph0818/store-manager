import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Store Manager API',
      version: '1.0.0',
      description: `
# Store Manager API Documentation

REST API for managing sales, inventory, orders and delivery.
Designed for integration with n8n automation workflows.

## Authentication

### Dashboard (JWT)
Use the \`Authorization: Bearer <token>\` header for dashboard endpoints (\`/api/auth\`, \`/api/products\`, etc.).

### n8n Integration (API Key)
Use the \`x-api-key: YOUR_API_KEY\` header for \`/api/v1/\` endpoints.
      `,
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API Key from your Settings page',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            costPrice: { type: 'string', example: '1500.00' },
            sellingPrice: { type: 'string', example: '2500.00' },
            stockQuantity: { type: 'integer' },
            isOutOfStock: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            customerName: { type: 'string' },
            customerPhone: { type: 'string' },
            wilayaCode: { type: 'string' },
            wilayaName: { type: 'string' },
            address: { type: 'string' },
            quantity: { type: 'integer' },
            productUnitPrice: { type: 'string' },
            deliveryType: { type: 'string', enum: ['home', 'desk'] },
            deliveryFee: { type: 'string' },
            totalAmount: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        DeliveryRate: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            wilayaCode: { type: 'string' },
            wilayaName: { type: 'string' },
            homeDeliveryPrice: { type: 'string' },
            deskDeliveryPrice: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Dashboard', description: 'Dashboard statistics' },
      { name: 'Products', description: 'Product management (JWT required)' },
      { name: 'Orders', description: 'Order management (JWT required)' },
      { name: 'Delivery', description: 'Delivery rates management (JWT required)' },
      { name: 'Settings', description: 'User settings (JWT required)' },
      { name: 'v1 Products', description: 'n8n: Product API (API Key required)' },
      { name: 'v1 Orders', description: 'n8n: Order API (API Key required)' },
      { name: 'v1 Delivery', description: 'n8n: Delivery API (API Key required)' },
    ],
  },
  apis: ['./src/routes/**/*.ts', './src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Store Manager API Docs',
    })
  );

  // Raw JSON spec endpoint for programmatic access
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
