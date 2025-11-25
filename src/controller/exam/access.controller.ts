import { Request, Response } from 'express';
import { ExamService } from '../../services/exam.service';

export const verifyExamAccess = async (req: Request, res: Response) => {
  try {
    const { accessKey } = req.params;

    if (!accessKey) {
      return res.status(400).json({ error: 'Access Key is required' });
    }

    const data = await ExamService.verifyAccess(accessKey);
    
    // Return everything the frontend needs to render the "Waiting Room"
    res.status(200).json({ success: true, data });

  } catch (error: any) {
    res.status(403).json({ success: false, error: error.message });
  }
};