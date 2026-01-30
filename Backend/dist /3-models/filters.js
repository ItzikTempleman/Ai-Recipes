"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaloryRestrictions = exports.DietaryRestrictions = exports.GlutenRestrictions = exports.LactoseRestrictions = exports.SugarRestriction = void 0;
var SugarRestriction;
(function (SugarRestriction) {
    SugarRestriction[SugarRestriction["DEFAULT"] = 0] = "DEFAULT";
    SugarRestriction[SugarRestriction["LOW"] = 1] = "LOW";
    SugarRestriction[SugarRestriction["NONE"] = 2] = "NONE";
})(SugarRestriction || (exports.SugarRestriction = SugarRestriction = {}));
;
var LactoseRestrictions;
(function (LactoseRestrictions) {
    LactoseRestrictions[LactoseRestrictions["DEFAULT"] = 0] = "DEFAULT";
    LactoseRestrictions[LactoseRestrictions["NONE"] = 1] = "NONE";
})(LactoseRestrictions || (exports.LactoseRestrictions = LactoseRestrictions = {}));
;
var GlutenRestrictions;
(function (GlutenRestrictions) {
    GlutenRestrictions[GlutenRestrictions["DEFAULT"] = 0] = "DEFAULT";
    GlutenRestrictions[GlutenRestrictions["NONE"] = 1] = "NONE";
})(GlutenRestrictions || (exports.GlutenRestrictions = GlutenRestrictions = {}));
;
var DietaryRestrictions;
(function (DietaryRestrictions) {
    DietaryRestrictions[DietaryRestrictions["DEFAULT"] = 0] = "DEFAULT";
    DietaryRestrictions[DietaryRestrictions["VEGAN"] = 1] = "VEGAN";
    DietaryRestrictions[DietaryRestrictions["KOSHER"] = 2] = "KOSHER";
})(DietaryRestrictions || (exports.DietaryRestrictions = DietaryRestrictions = {}));
var CaloryRestrictions;
(function (CaloryRestrictions) {
    CaloryRestrictions[CaloryRestrictions["DEFAULT"] = 0] = "DEFAULT";
    CaloryRestrictions[CaloryRestrictions["LOW"] = 1] = "LOW";
})(CaloryRestrictions || (exports.CaloryRestrictions = CaloryRestrictions = {}));
