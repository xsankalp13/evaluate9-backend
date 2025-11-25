import { Request, Response } from 'express';
import { TestService } from '../../services/test.service';

export const createTest = async (req: Request, res: Response) => {
  try {
    // req.tenantId is guaranteed by our middleware
    const tenantId = req.tenantId!; 
    const { title, description, botConfig, durationMin } = req.body;

    if (!title || !botConfig) {
      return res.status(400).json({ error: 'Title and Bot Config are required' });
    }

    const test = await TestService.createTest(tenantId, title, description, botConfig, durationMin);
    res.status(201).json({ success: true, data: test });
  } catch (error: any) {
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