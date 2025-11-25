import { JwtPayload } from 'jsonwebtoken';

export interface JwtAppPayload extends JwtPayload {
    id: string,
    email: string,
    role: string,
    tenantId: string
}