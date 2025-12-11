import { CaloryRestrictions, DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, QueryRestrictions, SugarRestriction } from "../3-models/filters";
import { InputModel } from "../3-models/InputModel";
import { Query } from "../3-models/recipe-model";
import { getBreakDownInstructions, getInstructions } from "./gpt-instructions";

class ResponseInstructions {
  public getQueryFromText(
    query: string,
    quantity: number,
    sugarRestriction: SugarRestriction,
    lactoseRestrictions: LactoseRestrictions,
    glutenRestrictions: GlutenRestrictions,
    dietaryRestrictions: DietaryRestrictions,
    caloryRestrictions: CaloryRestrictions,
    queryRestrictions: QueryRestrictions
  ): Query {
    const systemCommandDescription = getInstructions().trim();
    const userCommandDescription = getBreakDownInstructions(
      query,
      quantity,
      sugarRestriction,
      lactoseRestrictions,
      glutenRestrictions,
      dietaryRestrictions,
      caloryRestrictions,
      queryRestrictions
    ).trim();
    return { 
      systemCommandDescription, userCommandDescription 
    };
  }

  public getQuery(recipeInput: InputModel): Query {
    return this.getQueryFromText(
      recipeInput.query,
      recipeInput.quantity,
      recipeInput.sugarRestriction,
      recipeInput.lactoseRestrictions,
      recipeInput.glutenRestrictions,
      recipeInput.dietaryRestrictions,
      recipeInput.caloryRestrictions,
      recipeInput.queryRestrictions
    );
  }
}

export const responseInstructions = new ResponseInstructions();