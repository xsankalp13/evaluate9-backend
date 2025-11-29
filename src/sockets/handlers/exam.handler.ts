import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid'; // Ensure you have 'uuid' installed or use crypto
import { RagService } from '../../services/rag.service';
import { db } from '../../config/db';
import { redisClient } from '../../config/redis';

// TTL: 2 hours
const SESSION_TTL = 7200; 

interface QuestionItem {
  id: string;
  content: string;
}

interface ExamState {
  questions: QuestionItem[]; // Full list of questions with IDs
  isFinished: boolean;
  startTime: string;
}

export const ExamHandler = (socket: Socket) => {
  const sessionId = socket.data.sessionId;
  const testId = socket.data.testId;

  // --- Redis Helpers ---
  const getRedisKey = () => `session:${sessionId}`;

  const getState = async (): Promise<ExamState | null> => {
    const data = await redisClient.get(getRedisKey());
    return data ? JSON.parse(data) : null;
  };

  const saveState = async (state: ExamState) => {
    await redisClient.set(getRedisKey(), JSON.stringify(state), { EX: SESSION_TTL });
  };

  const clearState = async () => { await redisClient.del(getRedisKey()); };

  // --- EVENT: START_INTERVIEW (Refactored for Batch Flow) ---
  socket.on('start_interview', async () => {
    try {
      console.log(`[Exam] Start Batch requested for Session: ${sessionId}`);
      
      // 1. Check Redis for existing state (Resume logic)
      let state = await getState();

      if (state) {
        if (state.isFinished) {
             socket.emit('interview_finished', { message: "The interview is already completed." });
             return;
        }
        // Resend the full list of questions
        console.log(`[Exam] Resuming session with ${state.questions.length} questions`);
        socket.emit('init_questions', { questions: state.questions });
        return;
      }

      // 2. Cold Start: Fetch from DB
      const session = await db.examSession.findUnique({
        where: { id: sessionId },
        include: { test: true }
      });

      if (!session || !session.test.questionSets) {
        socket.emit('error', { message: 'Test data not found or questions not generated.' });
        return;
      }

      // 3. Pick Random Set & Assign UUIDs
      const sets = session.test.questionSets as any[]; 
      const selectedSet = sets[Math.floor(Math.random() * sets.length)];
      
      // Map questions to include a UUID so frontend can map answers back to them
      const questionsWithIds: QuestionItem[] = selectedSet.questions.map((q: any) => ({
        id: uuidv4(), // Generate ID for tracking
        content: q.content
      }));

      // 4. Initialize State
      state = {
        questions: questionsWithIds,
        isFinished: false,
        startTime: new Date().toISOString()
      };

      await saveState(state);

      // 5. Emit Full List to Client
      socket.emit('init_questions', { questions: state.questions });

      // Update DB status
      await db.examSession.update({
        where: { id: sessionId },
        data: { status: 'IN_PROGRESS', startTime: new Date() }
      });

    } catch (error) {
      console.error('Start Error:', error);
      socket.emit('error', { message: 'Failed to start exam' });
    }
  });

  // --- EVENT: SUBMIT_BATCH (New Handler) ---
  socket.on('submit_batch', async (payload: { answers: Record<string, string> }) => {
    console.log(`[Exam] Batch submission received for Session: ${sessionId}`);
    
    // 1. Retrieve State
    const state = await getState();
    if (!state || state.isFinished) {
        console.warn(`[Exam] Ignored submission for invalid/finished session`);
        return;
    }

    const userAnswers = payload.answers || {};
    const token = socket.handshake.auth.token;

    try {
        // 2. Parallel Evaluation in Batches
        // We use a batch size of 5 to avoid rate limiting
        const transcript: any[] = [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < state.questions.length; i += BATCH_SIZE) {
            const batch = state.questions.slice(i, i + BATCH_SIZE);
            console.log(`[Exam] Processing batch ${Math.ceil((i + 1) / BATCH_SIZE)} (${batch.length} items)...`);

            const batchPromises = batch.map(async (q) => {
                const userAnswer = userAnswers[q.id] || "No Answer Provided";
                
                // Call RAG Service
                const evalResult = await RagService.evaluateAnswer(
                    testId,
                    q.content,
                    userAnswer,
                    token
                );

                // Structure the transcript item
                return {
                    questionId: q.id,
                    question: q.content,
                    answer: userAnswer,
                    evaluation: evalResult.answer, // RAG Score & Feedback
                    ai_analysis: evalResult.ai_check || null // If ZeroGPT is included
                };
            });

            // Wait for this batch to complete before moving to the next
            const batchResults = await Promise.all(batchPromises);
            transcript.push(...batchResults);
        }

        // 3. Calculate Final Stats
        const totalScore = transcript.reduce((sum, item) => sum + (item.evaluation?.overall_score || 0), 0);
        const finalScore = totalScore / transcript.length;

        console.log(`[Exam] Evaluation Complete. Score: ${finalScore.toFixed(2)}%`);

        // 4. Persist to Postgres
        await db.examSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                score: finalScore,
                transcript: transcript, // Save full detailed report
                endTime: new Date()
            }
        });

        // 5. Cleanup Redis
        await clearState();

        // 6. Notify Client
        socket.emit('interview_finished', { message: "Evaluation submitted successfully." });

    } catch (error) {
        console.error('[Exam] Batch Evaluation Failed:', error);
        socket.emit('error', { message: "Failed to process submission. Please try again." });
    }
  });

  // --- DEPRECATED: Old Chat Handler ---
  // socket.on('send_message', () => { ... }) 
  // Removed to enforce batch flow.
};