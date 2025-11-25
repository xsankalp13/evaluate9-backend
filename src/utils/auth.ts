// auth.ts
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? 'fallback_secret') as Secret;
const EXPIRES_IN: SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (payload: Record<string, unknown>): string => {
  // payload must be string | JwtPayload | Buffer
  const signPayload: string | JwtPayload = payload as JwtPayload;
  return jwt.sign(signPayload, JWT_SECRET, { expiresIn: EXPIRES_IN });
};
