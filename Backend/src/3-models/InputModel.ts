import Joi from "joi";
import { ValidationError } from "./client-errors";

export class InputModel {
    public query!: string;
    public quantity!:number;

    constructor(inputModel: InputModel) {
        if (!inputModel) throw new ValidationError("Missing query");
        this.query = inputModel.query;
        this.quantity=inputModel.quantity;
    }

    private static validationSchema = Joi.object(
        {
            query: Joi.string().required().max(160),
            quantity: Joi.number().integer().min(1).max(100).required()
        }
    );

    public validate(): void {
        const result = InputModel.validationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
};
