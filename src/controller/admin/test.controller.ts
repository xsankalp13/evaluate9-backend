import { Request, Response } from 'express';
import { TestService } from '../../services/test.service';
import { RagService } from '../../services/rag.service';
import fs from 'fs';

// Small helper to give the Vector DB a moment to settle after ingestion
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createTest = async (req: Request, res: Response) => {
  const uploadedFiles = (req.files as Express.Multer.File[]) || [];
  
  try {
    console.log("Creating Test... Files received:", uploadedFiles.length);

    const tenantId = req.tenantId!;
    const { title, description, durationMin } = req.body;
    let { botConfig } = req.body;

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) throw new Error("Authorization token missing");

    if (uploadedFiles.length === 0) return res.status(400).json({ error: 'Question Bank PDF is required.' });
    if (typeof botConfig === 'string') { try { botConfig = JSON.parse(botConfig); } catch (e) {} }

    // 1. Create Test in DB
    const test = await TestService.createTest(
      tenantId, title || "Untitled Test", description, botConfig || {}, parseInt(durationMin) || 30
    );

    // 2. Start Ingestion (We AWAIT this, so it blocks until finished)
    const filePaths = uploadedFiles.map(f => f.path);
    console.log(`[Controller] Ingesting files for Test ${test.id}...`);
    
    // This line will wait the ~25 seconds for Python to finish
    await RagService.ingestKnowledgeBase(tenantId, test.id, botConfig, filePaths, token);
    
    console.log(`[Controller] Ingestion Complete. Generating Questions...`);

    // 3. Safety Delay (Optional but recommended)
    // Even if Python finishes, sometimes the Database needs 1s to be queryable.
    await wait(2000); 

    // 4. Generate Questions
    await TestService.generateAndSaveQuestionSets(test.id, token);

    console.log(`[Controller] Done!`);

    // 5. Cleanup
    uploadedFiles.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });

    res.status(201).json({ 
      success: true, 
      message: 'Test created and initialized successfully.',
      data: test 
    });

  } catch (error: any) {
    uploadedFiles.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    console.error("Create Test Failed:", error.message);
    // Return 500 so frontend knows it failed
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTests = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const tests = await TestService.getTests(tenantId);
    res.status(200).json({ success: true, data: tests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};