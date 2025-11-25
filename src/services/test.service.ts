import { db } from '../config/db';
import { RagService } from './rag.service';

export const TestService = {
  
  async createTest(tenantId: string, title: string, description: string, botConfig: any, durationMin: number) {
    return await db.test.create({
      data: {
        title,
        description,
        botConfig,
        durationMin,
        tenantId
      }
    });
  },

  async getTests(tenantId: string) {
    return await db.test.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getTestById(tenantId: string, testId: string) {
    const test = await db.test.findFirst({
      where: { id: testId, tenantId }
    });
    if (!test) throw new Error('Test not found');
    return test;
  },

  // --- NEW: Logic to Generate 60 Questions and Split ---
  async generateAndSaveQuestionSets(testId: string) {
    console.log(`[TestService] Generating 60 questions for Test: ${testId}`);

    // 1. Call RAG to get 60 raw questions
    // Note: Ensure your RAG API supports requesting this many
    const ragResponse = await RagService.generateQuestions(testId, 60, 'medium');
    let allQuestions = ragResponse.questions; // Expecting Array of objects

    if (!allQuestions || allQuestions.length === 0) {
      throw new Error("RAG failed to return questions");
    }

    // 2. Shuffle the array (Fisher-Yates Shuffle)
    // This ensures topics are mixed and not sequential
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    // 3. Split into 3 Sets (approx 20 each)
    // If we get fewer than 60, we split whatever we have into 3 chunks
    const chunkSize = Math.ceil(allQuestions.length / 3);
    
    const setA = allQuestions.slice(0, chunkSize);
    const setB = allQuestions.slice(chunkSize, chunkSize * 2);
    const setC = allQuestions.slice(chunkSize * 2);

    const questionSets = [
      { name: "Set A", questions: setA },
      { name: "Set B", questions: setB },
      { name: "Set C", questions: setC }
    ];

    // 4. Save to Database
    await db.test.update({
      where: { id: testId },
      data: { questionSets }
    });

    console.log(`[TestService] Saved 3 Sets (A:${setA.length}, B:${setB.length}, C:${setC.length})`);
    return questionSets;
  }
};