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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
// auth.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SALT_ROUNDS = 10;
const JWT_SECRET = ((_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'fallback_secret');
const EXPIRES_IN = ((_b = process.env.JWT_EXPIRES_IN) !== null && _b !== void 0 ? _b : '7d');
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcryptjs_1.default.hash(password, SALT_ROUNDS);
});
exports.hashPassword = hashPassword;
const comparePassword = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcryptjs_1.default.compare(password, hash);
});
exports.comparePassword = comparePassword;
const generateToken = (payload) => {
    // payload must be string | JwtPayload | Buffer
    const signPayload = payload;
    return jsonwebtoken_1.default.sign(signPayload, JWT_SECRET, { expiresIn: EXPIRES_IN });
};
exports.generateToken = generateToken;
