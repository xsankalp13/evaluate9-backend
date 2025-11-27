"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const db_1 = require("../config/db");
const auth_1 = require("../utils/auth");
exports.AuthService = {
    // 1. Register a new Startup (Tenant) and its first Admin
    registerTenant(companyName, email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if user exists
            const existingUser = yield db_1.db.user.findUnique({ where: { email } });
            if (existingUser)
                throw new Error('Email already in use');
            const hashedPassword = yield (0, auth_1.hashPassword)(password);
            // Transaction: Create Tenant AND User together
            const result = yield db_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // A. Create Tenant
                const newTenant = yield tx.tenant.create({
                    data: { name: companyName }
                });
                // B. Create Admin User linked to Tenant
                const newUser = yield tx.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        role: 'ADMIN',
                        tenantId: newTenant.id
                    }
                });
                return { tenant: newTenant, user: newUser };
            }));
            // Generate Token
            const token = (0, auth_1.generateToken)({
                id: result.user.id,
                email: result.user.email,
                role: result.user.role,
                tenantId: result.tenant.id
            });
            return { user: result.user, tenant: result.tenant, token };
        });
    },
    // 2. Login Logic
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.db.user.findUnique({ where: { email } });
            if (!user)
                throw new Error('Invalid credentials');
            const isValid = yield (0, auth_1.comparePassword)(password, user.password);
            if (!isValid)
                throw new Error('Invalid credentials');
            const token = (0, auth_1.generateToken)({
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId
            });
            return { user, token };
        });
    }
};
