import { db } from '../config/db';
import { generateToken } from '../utils/auth';

export const ExamService = {
  
  // Verify the Candidate's Access Key
  async verifyAccess(accessKey: string) {
    // 1. Find the Candidate by the unique key
    const candidate = await db.candidate.findUnique({
      where: { accessKey },
      include: {
        tenant: true // We need config (logo, name)
      }
    });

    if (!candidate) throw new Error('Invalid Access Key');

    // 2. Find the SCHEDULED session for this candidate
    // (Assuming 1 active test per candidate for MVP)
    const session = await db.examSession.findFirst({
      where: {
        candidateId: candidate.id,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] } // Allow re-entry if crashed
      },
      include: {
        test: true // We need Test Title, Duration, Bot Config
      }
    });

    if (!session) throw new Error('No active test found for this candidate');

    // 3. Generate a temporary "Exam Token" for the WebSocket
    // This is different from the Admin Token. It identifies the Candidate.
    const examToken = generateToken({
      candidateId: candidate.id,
      sessionId: session.id,
      tenantId: candidate.tenantId,
      role: 'CANDIDATE'
    });

    return {
      candidate: { name: candidate.name, email: candidate.email },
      tenant: { name: candidate.tenant.name, config: candidate.tenant.config },
      test: { title: session.test.title, duration: session.test.durationMin },
      session: { id: session.id, status: session.status, startTime: session.startTime },
      token: examToken
    };
  }
};