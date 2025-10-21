"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputModel = void 0;
const joi_1 = __importDefault(require("joi"));
const client_errors_1 = require("./client-errors");
class InputModel {
    query;
    quantity;
    constructor(inputModel) {
        if (!inputModel)
            throw new client_errors_1.ValidationError("Missing query");
        this.query = inputModel.query;
        this.quantity = inputModel.quantity;
    }
    static validationSchema = joi_1.default.object({
        query: joi_1.default.string().required().max(160),
        quantity: joi_1.default.number().integer().min(1).max(100).required()
    });
    validate() {
        const result = InputModel.validationSchema.validate(this);
        if (result.error)
            throw new client_errors_1.ValidationError(result.error.message);
    }
}
exports.InputModel = InputModel;
;
