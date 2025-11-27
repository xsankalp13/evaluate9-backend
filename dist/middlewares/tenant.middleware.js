"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenant = void 0;
// This ensures that every request processed after this point HAS a tenantId
const requireTenant = (req, res, next) => {
    if (!req.user || !req.user.tenantId) {
        return res.status(403).json({ error: 'Forbidden: No Tenant Context found' });
    }
    // Explicitly set tenantId on the request for easy access in Controllers
    req.tenantId = req.user.tenantId;
    next();
};
exports.requireTenant = requireTenant;
