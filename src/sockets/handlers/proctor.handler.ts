import { Socket } from 'socket.io';
import { db } from '../../config/db';

const MAX_VIOLATIONS = 3;

export const ProctorHandler = (socket: Socket) => {
  const sessionId = socket.data.sessionId;

  socket.on('report_violation', async (data) => {
    // DEBUG LOG 1: Did we receive the event?
    console.log(`[DEBUG] Received Violation Event from ${socket.id}`, data);

    try {
      if (!sessionId) {
         console.error('[DEBUG] No Session ID found in socket');
         return;
      }

      // 1. Fetch Session
      const session = await db.examSession.findUnique({
        where: { id: sessionId },
        select: { violations: true, status: true }
      });

      if (!session) {
          console.error('[DEBUG] Session not found in DB');
          return;
      }

      // DEBUG LOG 2: Check current status
      console.log(`[DEBUG] Current Status: ${session.status}, Violations:`, session.violations);

      if (session.status === 'COMPLETED' || session.status === 'TERMINATED') {
        console.log('[DEBUG] Ignored because session is already over');
        return; 
      }

      // 2. Append Violation
      // Ensure we cast strictly to array, handling null case
      const currentViolations = Array.isArray(session.violations) ? session.violations : [];
      
      const newViolation = {
        type: data.type || 'UNKNOWN',
        timestamp: new Date().toISOString()
      };
      
      const updatedViolations = [...currentViolations, newViolation];
      const violationCount = updatedViolations.length;

      // 3. Update DB
      await db.examSession.update({
        where: { id: sessionId },
        data: { violations: updatedViolations }
      });
      
      console.log(`[DEBUG] DB Updated. Count: ${violationCount}`);

      // 4. Trigger Consequences
      if (violationCount < MAX_VIOLATIONS) {
        console.log('[DEBUG] Emitting Warning');
        socket.emit('proctor_warning', {
          message: `Warning: ${data.type} detected. Attempts left: ${MAX_VIOLATIONS - violationCount}`,
          count: violationCount,
          max: MAX_VIOLATIONS
        });
      } else {
        console.log('[DEBUG] Terminating Exam');
        await db.examSession.update({
          where: { id: sessionId },
          data: { status: 'TERMINATED', endTime: new Date() }
        });

        socket.emit('exam_terminated', {
          reason: 'Maximum proctoring violations reached.'
        });
        
        socket.disconnect(true);
      }

    } catch (error) {
      console.error('[Proctor] CRITICAL ERROR:', error);
    }
  });
};