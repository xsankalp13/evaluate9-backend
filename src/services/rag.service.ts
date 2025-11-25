import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Configuration for your RAG Pipeline API
const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000'; 

export const RagService = {

  /**
   * 1. Ingest Content
   * Endpoint: /ingest
   * Method: POST (multipart/form-data)
   */
  async ingestKnowledgeBase(
    tenantId: string, 
    testId: string, 
    botConfig: any, 
    filePath: string
  ) {
    try {
      const formData = new FormData();

      // Required Fields
      formData.append('tenant_id', tenantId);
      formData.append('test_id', testId);
      
      // Metadata (JSON String)
      formData.append('metadata', JSON.stringify(botConfig || {}));

      // Documents JSON (Default empty array as we are uploading a file)
      formData.append('documents_json', JSON.stringify([]));

      // Binary File (Field name must be 'files' based on docs)
      if (filePath && fs.existsSync(filePath)) {
        formData.append('files', fs.createReadStream(filePath)); 
      }

      const response = await axios.post(`${RAG_API_URL}/ingest`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log(`[RAG] Ingestion Success:`, response.data);
      return response.data;

    } catch (error: any) {
      console.error('[RAG] Ingestion Failed:', error.response?.data || error.message);
      throw new Error('Failed to ingest document into RAG pipeline');
    }
  },

  /**
   * 3. Generate Questions
   * Endpoint: /generate-questions
   * Method: POST (JSON)
   */
  async generateQuestions(
    testId: string, 
    numQuestions: number = 5, 
    difficulty: string = "medium",
    alreadyHas: string[] = []
  ) {
    try {
      const response = await axios.post(`${RAG_API_URL}/generate-questions`, {
        test_id: testId,
        num_questions: numQuestions,
        difficulty: difficulty,
        already_has: alreadyHas
      });

      // Returns: { questions: [{ question_no, content }] }
      return response.data;

    } catch (error: any) {
      console.error('[RAG] Generate Questions Failed:', error.response?.data || error.message);
      // Fallback or throw
      throw new Error('Failed to generate questions from RAG');
    }
  },

  /**
   * 2. Retrieve Context & Score Answer
   * Endpoint: /retrieve
   * Method: POST (JSON)
   */
  async evaluateAnswer(
    testId: string,
    question: string,
    candidateAnswer: string
  ) {
    try {
      const response = await axios.post(`${RAG_API_URL}/retrieve`, {
        question: question,
        query: candidateAnswer, // The candidate's answer
        filters: {
          test_id: testId
        },
        top_k: 3
      });

      // Returns: { results: [], answer: { overall_score, breakdown, ... } }
      return response.data;

    } catch (error: any) {
      console.error('[RAG] Evaluation Failed:', error.response?.data || error.message);
      throw new Error('Failed to evaluate answer via RAG');
    }
  },

  /**
   * 4. Health Check
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${RAG_API_URL}/health`);
      return response.data;
    } catch (error) {
      return { status: 'down' };
    }
  }
};