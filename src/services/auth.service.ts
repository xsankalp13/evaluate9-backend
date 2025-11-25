import { db } from '../config/db';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { User, Role } from '@prisma/client';

export const AuthService = {
  // 1. Register a new Startup (Tenant) and its first Admin
  async registerTenant(companyName: string, email: string, password: string) {
    // Check if user exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email already in use');

    const hashedPassword = await hashPassword(password);

    // Transaction: Create Tenant AND User together
    const result = await db.$transaction(async (tx) => {
      // A. Create Tenant
      const newTenant = await tx.tenant.create({
        data: { name: companyName }
      });

      // B. Create Admin User linked to Tenant
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: newTenant.id
        }
      });

      return { tenant: newTenant, user: newUser };
    });

    // Generate Token
    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      tenantId: result.tenant.id
    });

    return { user: result.user, tenant: result.tenant, token };
  },

  // 2. Login Logic
  async login(email: string, password: string) {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });

    return { user, token };
  }
};