import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Bot Evaluation Platform API',
      version: '1.0.0',
      description: 'API documentation for the Admin Portal and Exam Engine',
      contact: {
        name: 'API Support',
        email: 'support@aieval.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000/api/v1',
        description: 'Local Development Server',
      },
      {
        url: 'https://api.yourdomain.com/api/v1',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Look for comments in these files
  apis: ['./src/routes/*.ts', './src/controllers/**/*.ts'], 
};

export const swaggerSpec = swaggerJsdoc(options);