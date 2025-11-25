import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { companyName, email, password } = req.body;
    
    if (!companyName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const data = await AuthService.registerTenant(companyName, email, password);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const data = await AuthService.login(email, password);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
};