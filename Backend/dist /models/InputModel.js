"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputModel = void 0;
const joi_1 = __importDefault(require("joi"));
const client_errors_1 = require("./client-errors");
const filters_1 = require("./filters");
class InputModel {
    query;
    quantity;
    sugarRestriction;
    lactoseRestrictions;
    glutenRestrictions;
    dietaryRestrictions;
    caloryRestrictions;
    queryRestrictions;
    constructor(inputModel) {
        if (!inputModel)
            throw new client_errors_1.ValidationError("Missing input data");
        this.query = inputModel.query;
        this.quantity = inputModel.quantity;
        this.sugarRestriction = inputModel.sugarRestriction ?? filters_1.SugarRestriction.DEFAULT;
        ;
        this.lactoseRestrictions = inputModel.lactoseRestrictions ?? filters_1.LactoseRestrictions.DEFAULT;
        this.glutenRestrictions = inputModel.glutenRestrictions ?? filters_1.GlutenRestrictions.DEFAULT;
        this.dietaryRestrictions = inputModel.dietaryRestrictions ?? filters_1.DietaryRestrictions.DEFAULT;
        this.caloryRestrictions = inputModel.caloryRestrictions ?? filters_1.CaloryRestrictions.DEFAULT;
        this.queryRestrictions = inputModel.queryRestrictions ?? [];
    }
    ;
    static validationSchema = joi_1.default.object({
        query: joi_1.default.string().required().max(160),
        quantity: joi_1.default.number().integer().min(1).max(100).required(),
        sugarRestriction: joi_1.default.number().valid(filters_1.SugarRestriction.DEFAULT, filters_1.SugarRestriction.LOW, filters_1.SugarRestriction.NONE).optional(),
        lactoseRestrictions: joi_1.default.number().valid(filters_1.LactoseRestrictions.DEFAULT, filters_1.LactoseRestrictions.NONE).optional(),
        glutenRestrictions: joi_1.default.number().valid(filters_1.GlutenRestrictions.DEFAULT, filters_1.GlutenRestrictions.NONE).optional(),
        dietaryRestrictions: joi_1.default.number().valid(filters_1.DietaryRestrictions.DEFAULT, filters_1.DietaryRestrictions.VEGAN, filters_1.DietaryRestrictions.KOSHER).optional(),
        caloryRestrictions: joi_1.default.number().valid(filters_1.CaloryRestrictions.DEFAULT, filters_1.CaloryRestrictions.LOW).optional(),
        queryRestrictions: joi_1.default.array().items(joi_1.default.string().allow("")).optional()
    });
    validate() {
        const result = InputModel.validationSchema.validate(this);
        if (result.error)
            throw new client_errors_1.ValidationError(result.error.message);
        if (!this.query || this.query.trim().length === 0) {
            throw new client_errors_1.ValidationError("Please enter a dish or recipe idea.");
        }
    }
}
exports.InputModel = InputModel;
;
