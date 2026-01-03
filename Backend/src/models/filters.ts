 export enum SugarRestriction {
    DEFAULT, LOW, NONE
};

 export enum LactoseRestrictions {
    DEFAULT, NONE
};

 export enum GlutenRestrictions {
    DEFAULT, NONE
};

 export enum DietaryRestrictions {
    DEFAULT, VEGAN, KOSHER
}

 export enum CaloryRestrictions {
    DEFAULT, LOW
}

export type QueryRestrictions = string[];