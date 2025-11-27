import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000'; 

export const RagService = {

  async ingestKnowledgeBase(tenantId: string, testId: string, botConfig: any, filePaths: string[], token: string) {
    try {
      const formData = new FormData();
      formData.append('tenant_id', tenantId);
      formData.append('test_id', testId);
      formData.append('metadata', JSON.stringify(botConfig || {}));
      formData.append('documents_json', JSON.stringify([]));

      if (filePaths && filePaths.length > 0) {
        for (const filePath of filePaths) {
          if (fs.existsSync(filePath)) {
            formData.append('files', fs.createReadStream(filePath)); 
          }
        }
      }

      const response = await axios.post(`${RAG_API_URL}/ingest`, formData, {
        headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${token}` },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      console.log(response.data);
      return response.data;
    } catch (error: any) {
      console.error('[RAG] Ingestion Failed:', error.response?.data || error.message);
      throw error; // Re-throw original error
    }
  },

  async generateQuestions(testId: string, numQuestions: number = 5, difficulty: string = "medium", alreadyHas: string[] = [], token: string) {
    try {
      const response = await axios.post(`${RAG_API_URL}/generate-questions`, {
        test_id: testId,
        num_questions: numQuestions,
        difficulty: difficulty,
        already_has: alreadyHas
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      
      return response.data;
    } catch (error: any) {
      // IMPORTANT: Do NOT wrap this in a new Error(). 
      // We need the original Axios error to see the 404 status in the controller.
      throw error; 
    }
  },

  async evaluateAnswer(testId: string, question: string, candidateAnswer: string, token: string) {
    try {
      const response = await axios.post(`${RAG_API_URL}/retrieve`, {
        question: question,
        query: candidateAnswer, 
        filters: { test_id: testId },
        top_k: 3
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      
      return response.data;
    } catch (error: any) {
      console.error('[RAG] Evaluation Failed:', error.message);
      throw error;
    }
  }
};