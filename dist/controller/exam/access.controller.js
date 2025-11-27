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
exports.verifyExamAccess = void 0;
const exam_service_1 = require("../../services/exam.service");
const verifyExamAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accessKey } = req.params;
        if (!accessKey) {
            return res.status(400).json({ error: 'Access Key is required' });
        }
        const data = yield exam_service_1.ExamService.verifyAccess(accessKey);
        // Return everything the frontend needs to render the "Waiting Room"
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        res.status(403).json({ success: false, error: error.message });
    }
});
exports.verifyExamAccess = verifyExamAccess;
