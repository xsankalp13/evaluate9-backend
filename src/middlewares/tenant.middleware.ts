import { Request, Response, NextFunction } from 'express';

// This ensures that every request processed after this point HAS a tenantId
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({ error: 'Forbidden: No Tenant Context found' });
  }

  // Explicitly set tenantId on the request for easy access in Controllers
  req.tenantId = req.user.tenantId;

  next();
};