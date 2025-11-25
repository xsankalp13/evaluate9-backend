import { db } from '../config/db';

export const TestService = {
  
  // Create a new Evaluation Test
  async createTest(tenantId: string, title: string, description: string, botConfig: any, durationMin: number) {
    return await db.test.create({
      data: {
        title,
        description,
        botConfig,
        durationMin,
        tenantId // <--- Linked to the specific Tenant
      }
    });
  },

  // Get all tests for the logged-in Tenant
  async getTests(tenantId: string) {
    return await db.test.findMany({
      where: {
        tenantId // <--- CRITICAL: Prevents seeing other tenants' tests
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // Get a single test (Verification that it belongs to tenant)
  async getTestById(tenantId: string, testId: string) {
    const test = await db.test.findFirst({
      where: {
        id: testId,
        tenantId // <--- Security check
      }
    });

    if (!test) throw new Error('Test not found');
    return test;
  }
};