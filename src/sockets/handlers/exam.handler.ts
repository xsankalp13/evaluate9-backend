import { Socket } from 'socket.io';
import { RagService } from '../../services/rag.service';
import { db } from '../../config/db';
import { redisClient } from '../../config/redis';

// The state object we will save to Redis
interface ExamState {
  questions: any[];
  currentIndex: number;
  isFinished: boolean;
  transcript: any[];
}

// TTL: 2 hours (in seconds) - Session expires if inactive
const SESSION_TTL = 7200; 

export const ExamHandler = (socket: Socket) => {
  const sessionId = socket.data.sessionId;

  // --- Redis Helpers ---
  const getRedisKey = () => `session:${sessionId}`;

  const getState = async (): Promise<ExamState | null> => {
    const data = await redisClient.get(getRedisKey());
    return data ? JSON.parse(data) : null;
  };

  const saveState = async (state: ExamState) => {
    await redisClient.set(getRedisKey(), JSON.stringify(state), {
        EX: SESSION_TTL
    });
  };

  const clearState = async () => {
    await redisClient.del(getRedisKey());
  };

  // --- Event: Start / Resume Interview ---
  socket.on('start_interview', async () => {
    try {
      console.log(`[Exam] Start/Resume requested for Session: ${sessionId}`);
      
      // 1. Check Redis for active state (Resume Logic)
      let state = await getState();

      if (state) {
        console.log(`[Exam] Resuming from Redis. Question ${state.currentIndex + 1}/${state.questions.length}`);
        
        // If finished, just send the end message
        if (state.isFinished) {
             socket.emit('receive_message', { sender: 'AI', message: "The interview is already completed.", timestamp: new Date() });
             return;
        }

        // Re-send the current question to the UI
        const currentQ = state.questions[state.currentIndex];
        socket.emit('receive_message', {
            sender: 'AI',
            message: `(Resuming) ${currentQ.content}`,
            timestamp: new Date()
        });
        return;
      }

      // 2. If no Redis state, Cold Start (Fetch from DB)
      const session = await db.examSession.findUnique({
        where: { id: sessionId },
        include: { test: true }
      });

      if (!session || !session.test.questionSets) {
        socket.emit('error', { message: 'Test data not found.' });
        return;
      }

      // 3. Pick a Random Set
      const sets = session.test.questionSets as any[]; 
      const randomSetIndex = Math.floor(Math.random() * sets.length);
      const selectedSet = sets[randomSetIndex];

      console.log(`[Exam] Initialized new session with ${selectedSet.name}`);

      // 4. Initialize State
      state = {
        questions: selectedSet.questions,
        currentIndex: 0,
        isFinished: false,
        transcript: []
      };

      // 5. Save to Redis
      await saveState(state);

      // 6. Send First Question
      if (state.questions.length > 0) {
        socket.emit('receive_message', {
          sender: 'AI',
          message: state.questions[0].content,
          timestamp: new Date()
        });

        // Update DB status to IN_PROGRESS
        await db.examSession.update({
          where: { id: sessionId },
          data: { status: 'IN_PROGRESS', startTime: new Date() }
        });
      }

    } catch (error) {
      console.error('Start Error:', error);
      socket.emit('error', { message: 'Failed to start exam' });
    }
  });

  // --- Event: User Answer ---
  socket.on('send_message', async (payload) => {
    // Always fetch fresh state from Redis
    let state = await getState();

    if (!state || state.isFinished) {
        console.warn(`[Exam] Ignored message for finished/invalid session ${sessionId}`);
        return;
    }

    const userMessage = payload.message;
    const currentQ = state.questions[state.currentIndex];
    // EXTRACT TOKEN FROM SOCKET HANDSHAKE
    const token = socket.handshake.auth.token;

    try {
      // 1. Evaluate Answer (RAG)
      const evalResult = await RagService.evaluateAnswer(
        socket.data.testId,
        currentQ.content,
        userMessage,
        token
      );

      // 2. Update Transcript
      state.transcript.push({
        question: currentQ.content,
        answer: userMessage,
        evaluation: evalResult.answer 
      });

      // 3. Advance Index
      state.currentIndex++;

      // 4. Save Progress to Redis
      await saveState(state);

      // 5. Next Step Logic
      if (state.currentIndex < state.questions.length) {
        // CASE: Next Question
        const nextQ = state.questions[state.currentIndex];
        
        setTimeout(() => {
          socket.emit('receive_message', {
            sender: 'AI',
            message: nextQ.content,
            timestamp: new Date()
          });
        }, 1000);

      } else {
        // CASE: Finish Exam
        state.isFinished = true;
        await saveState(state); // Save finished flag
        
        const finalMessage = "Thank you. That concludes the evaluation.";
        socket.emit('receive_message', { sender: 'AI', message: finalMessage, timestamp: new Date() });
        socket.emit('interview_finished');

        // Flush to Postgres
        await db.examSession.update({
          where: { id: sessionId },
          data: { 
            status: 'COMPLETED',
            endTime: new Date(),
            transcript: state.transcript,
            score: calculateAverageScore(state.transcript)
          }
        });

        // Optional: Clear Redis after DB sync (or keep it for a while to allow viewing results)
        await clearState();
      }

    } catch (error) {
      console.error('Eval Error:', error);
      socket.emit('error', { message: 'Error evaluating answer.' });
    }
  });
};

// Helper
function calculateAverageScore(transcript: any[]) {
  if (transcript.length === 0) return 0;
  const total = transcript.reduce((sum, item) => sum + (item.evaluation?.overall_score || 0), 0);
  return total / transcript.length;
}