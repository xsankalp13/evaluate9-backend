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
exports.login = exports.register = void 0;
const auth_service_1 = require("../../services/auth.service");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyName, email, password } = req.body;
        if (!companyName || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const data = yield auth_service_1.AuthService.registerTenant(companyName, email, password);
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }
        const data = yield auth_service_1.AuthService.login(email, password);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});
exports.login = login;
