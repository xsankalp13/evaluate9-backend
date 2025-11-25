import { db } from '../config/db';

export const CandidateService = {
  
  // Add a candidate and assign them to a test immediately
  async addCandidateToTest(tenantId: string, testId: string, email: string, name: string) {
    
    // 1. Check if Test belongs to Tenant (Security)
    const test = await db.test.findFirst({
      where: { id: testId, tenantId }
    });
    if (!test) throw new Error('Test not found or access denied');

    // 2. Find or Create Candidate (Upsert)
    // We use "upsert" so we don't duplicate candidates with the same email in the same tenant
    const candidate = await db.candidate.upsert({
      where: {
        email_tenantId: { email, tenantId } // Unique constraint we defined in schema
      },
      update: { name }, // Update name if they exist
      create: {
        email,
        name,
        tenantId
      }
    });

    // 3. Create the Exam Session (The actual "Ticket" to take the test)
    // Check if session already exists to prevent duplicate invites for same test
    const existingSession = await db.examSession.findFirst({
      where: { testId, candidateId: candidate.id }
    });

    if (existingSession) {
      return { candidate, session: existingSession, isNew: false };
    }

    const session = await db.examSession.create({
      data: {
        testId,
        candidateId: candidate.id,
        status: 'SCHEDULED'
      }
    });

    return { candidate, session, isNew: true };
  },

  // Get all candidates for a specific test (for the Admin Dashboard list)
  async getCandidatesByTest(tenantId: string, testId: string) {
    return await db.examSession.findMany({
      where: {
        testId,
        test: { tenantId } // Security check
      },
      include: {
        candidate: true // Join candidate details
      }
    });
  }
};