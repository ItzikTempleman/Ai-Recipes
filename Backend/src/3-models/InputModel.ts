import Joi from "joi";
import { ValidationError } from "./client-errors";
import { CaloryRestrictions, DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, QueryRestrictions, SugarRestriction } from "./filters";

export class InputModel {
    public query!: string;
    public quantity!: number;
    public sugarRestriction!: SugarRestriction;
    public lactoseRestrictions!: LactoseRestrictions
    public glutenRestrictions!: GlutenRestrictions
    public dietaryRestrictions!: DietaryRestrictions;
    public caloryRestrictions!: CaloryRestrictions;
    public queryRestrictions!: QueryRestrictions;

    constructor(inputModel: InputModel) {
        if (!inputModel) throw new ValidationError("Missing input data");
        this.query = inputModel.query;
        this.quantity = inputModel.quantity;
        this.sugarRestriction = inputModel.sugarRestriction ?? SugarRestriction.DEFAULT;;
        this.lactoseRestrictions = inputModel.lactoseRestrictions ?? LactoseRestrictions.DEFAULT;
        this.glutenRestrictions = inputModel.glutenRestrictions ?? GlutenRestrictions.DEFAULT;
        this.dietaryRestrictions = inputModel.dietaryRestrictions ?? DietaryRestrictions.DEFAULT;
        this.caloryRestrictions = inputModel.caloryRestrictions ?? CaloryRestrictions.DEFAULT;
        this.queryRestrictions = inputModel.queryRestrictions ?? [];
    };

    private static validationSchema = Joi.object(
        {
            query: Joi.string().required().max(160),
            quantity: Joi.number().integer().min(1).max(100).required(),
            sugarRestriction: Joi.number().valid(SugarRestriction.DEFAULT, SugarRestriction.LOW, SugarRestriction.NONE).optional(),
            lactoseRestrictions: Joi.number().valid(LactoseRestrictions.DEFAULT, LactoseRestrictions.NONE).optional(),
            glutenRestrictions: Joi.number().valid(GlutenRestrictions.DEFAULT, GlutenRestrictions.NONE).optional(),
            dietaryRestrictions: Joi.number().valid(DietaryRestrictions.DEFAULT,DietaryRestrictions.VEGAN,DietaryRestrictions.KOSHER).optional(),
            caloryRestrictions: Joi.number().valid(CaloryRestrictions.DEFAULT, CaloryRestrictions.LOW).optional(),
            queryRestrictions: Joi.array().items(Joi.string().allow("")).optional()
        }
    );

    public validate(): void {
        const result = InputModel.validationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
        if (!this.query || this.query.trim().length === 0) {
            throw new ValidationError("Please enter a dish or recipe idea.");
        }
    }
};
