import { db } from '../config/db';
import { RagService } from './rag.service';

export const TestService = {
  
  async createTest(tenantId: string, title: string, description: string, botConfig: any, durationMin: number) {
    return await db.test.create({
      data: { title, description, botConfig, durationMin, tenantId }
    });
  },

  async getTests(tenantId: string) {
    return await db.test.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  },

  // --- SIMPLE VERSION (No Retry Loop) ---
  async generateAndSaveQuestionSets(testId: string, token: string) {
    console.log(`[TestService] Calling RAG to generate questions...`);

    // 1. Call RAG (We expect this to work immediately now)
    const ragResponse = await RagService.generateQuestions(testId, 60, 'medium', [], token);
    const allQuestions = ragResponse.questions;

    if (!allQuestions || allQuestions.length === 0) {
        throw new Error("RAG returned empty questions list");
    }

    // 2. Shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    // 3. Split
    const chunkSize = Math.ceil(allQuestions.length / 3);
    const questionSets = [
        { name: "Set A", questions: allQuestions.slice(0, chunkSize) },
        { name: "Set B", questions: allQuestions.slice(chunkSize, chunkSize * 2) },
        { name: "Set C", questions: allQuestions.slice(chunkSize * 2) }
    ];

    // 4. Save
    await db.test.update({
        where: { id: testId },
        data: { questionSets }
    });

    console.log(`[TestService] Saved ${allQuestions.length} questions into 3 sets.`);
    return questionSets;
  }
};