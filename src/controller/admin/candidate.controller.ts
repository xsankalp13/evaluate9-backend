import { Request, Response } from 'express';
import { CandidateService } from '../../services/candidate.service';

import fs from 'fs';
import csv from 'csv-parser';
import multer from 'multer';

export const addCandidate = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { testId, email, name } = req.body;

    if (!testId || !email || !name) {
      return res.status(400).json({ error: 'testId, email, and name are required' });
    }

    const result = await CandidateService.addCandidateToTest(tenantId, testId, email, name);
    
    // Construct the "Magic Link" the user would click
    // In production, you would email this. For MVP, we return it in API.
    // URL format: http://frontend.com/exam/{candidate_access_key}
    const magicLink = `${process.env.CLIENT_URL}/exam/${result.candidate.accessKey}`;

    res.status(201).json({ 
      success: true, 
      data: result,
      magicLink 
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listCandidates = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { testId } = req.params; // /candidates/:testId

    if (!testId) return res.status(400).json({ error: 'Test ID required' });

    const sessions = await CandidateService.getCandidatesByTest(tenantId, testId);
    res.status(200).json({ success: true, data: sessions });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkUpload = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { testId } = req.body;

    if (!req.file || !testId) {
      return res.status(400).json({ error: 'CSV file and testId are required' });
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Parse CSV from the uploaded file path
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Process each row
        const processed = [];
        for (const row of results) {
          // Expect CSV headers: email, name
          if (row.email && row.name) {
            try {
              const result = await CandidateService.addCandidateToTest(tenantId, testId, row.email, row.name);
              processed.push({ email: row.email, status: 'ADDED', magicLink: `${process.env.CLIENT_URL}/exam/${result.candidate.accessKey}` });
            } catch (err: any) {
              errors.push({ email: row.email, error: err.message });
            }
          }
        }

        // Cleanup: Delete the uploaded file to save space
        if(req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({ success: true, processed, errors });
      });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCandidateSession = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { sessionId } = req.params;

    const session = await CandidateService.getSessionById(tenantId, sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.status(200).json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};