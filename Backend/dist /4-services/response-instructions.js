"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseInstructions = void 0;
const gpt_instructions_1 = require("./gpt-instructions");
class ResponseInstructions {
    getQueryFromText(query, quantity, sugarRestriction, lactoseRestrictions, glutenRestrictions, dietaryRestrictions, caloryRestrictions, queryRestrictions) {
        const systemCommandDescription = (0, gpt_instructions_1.getInstructions)().trim();
        const userCommandDescription = (0, gpt_instructions_1.getBreakDownInstructions)(query, quantity, sugarRestriction, lactoseRestrictions, glutenRestrictions, dietaryRestrictions, caloryRestrictions, queryRestrictions).trim();
        return {
            systemCommandDescription, userCommandDescription
        };
    }
    getQuery(recipeInput) {
        return this.getQueryFromText(recipeInput.query, recipeInput.quantity, recipeInput.sugarRestriction, recipeInput.lactoseRestrictions, recipeInput.glutenRestrictions, recipeInput.dietaryRestrictions, recipeInput.caloryRestrictions, recipeInput.queryRestrictions);
    }
}
exports.responseInstructions = new ResponseInstructions();
