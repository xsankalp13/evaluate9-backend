import { Request, Response } from 'express';
import { TestService } from '../../services/test.service';
import { RagService } from '../../services/rag.service';
import fs from 'fs';

export const createTest = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    
    // 1. Parse Data (When using Multer, body fields are strings)
    // We need to JSON.parse the botConfig because it comes as a string in multipart-form
    const { title, description, durationMin } = req.body;
    let { botConfig } = req.body;

    if (typeof botConfig === 'string') {
      botConfig = JSON.parse(botConfig);
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Question Bank PDF is required' });
    }

    // 2. Create Test in Database (Status: PENDING until RAG confirms)
    const test = await TestService.createTest(
      tenantId, 
      title, 
      description, 
      botConfig, 
      parseInt(durationMin) || 30
    );

    // 3. Trigger RAG Ingestion
    // We pass the file path that Multer saved temporarily
    await RagService.ingestKnowledgeBase(
      tenantId,
      test.id,
      botConfig,
      req.file.path
    );

    // 4. Cleanup: Delete temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ 
      success: true, 
      message: 'Test created and Knowledge Base ingested successfully',
      data: test 
    });

  } catch (error: any) {
    // If RAG fails, we should technically delete the test we just created
    // or mark it as "FAILED" in the DB.
    if (req.file) fs.unlinkSync(req.file.path); // Ensure cleanup
    res.status(500).json({ success: false, error: error.message });
  }
};

// ... keep getTests as is ...
export const getTests = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const tests = await TestService.getTests(tenantId);
    res.status(200).json({ success: true, data: tests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};